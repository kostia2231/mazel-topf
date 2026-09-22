#!/usr/bin/env bash
set -euo pipefail

usage() {
    cat <<'TXT'
Create the CloudFront distribution that serves the site bucket.

    bash scripts/setup-cloudfront.sh

Reads BUCKET (and optional AWS_PROFILE, AWS_REGION) from .env.deploy, then:

    - creates an origin access control for the bucket
    - publishes the routing function from aws/cloudfront/rewrite.js
    - creates the distribution with error pages and cache behaviour
    - attaches the bucket policy that lets only this distribution read
    - writes DISTRIBUTION back into .env.deploy

Safe to re-run: existing pieces are reused, nothing is deleted.
TXT
}

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

for arg in "$@"; do
    case "$arg" in
        --help|-h) usage; exit 0 ;;
        *) echo "unknown argument: $arg" >&2; usage >&2; exit 2 ;;
    esac
done

[ -f .env.deploy ] || { echo ".env.deploy not found, copy .env.deploy.example first" >&2; exit 2; }
set -a
. ./.env.deploy
set +a

[ -n "${BUCKET:-}" ] || { echo "BUCKET is not set in .env.deploy" >&2; exit 2; }
command -v aws >/dev/null || { echo "aws cli not found" >&2; exit 1; }

account="$(aws sts get-caller-identity --query Account --output text)"
region="$(aws s3api get-bucket-location --bucket "$BUCKET" --query LocationConstraint --output text)"
[ "$region" = "None" ] && region="us-east-1"
origin_domain="$BUCKET.s3.$region.amazonaws.com"

echo "account   $account"
echo "bucket    $BUCKET"
echo "region    $region"
echo

oac_name="$BUCKET-oac"
oac_id="$(aws cloudfront list-origin-access-controls \
    --query "OriginAccessControlList.Items[?Name=='$oac_name'].Id | [0]" --output text)"

if [ "$oac_id" = "None" ] || [ -z "$oac_id" ]; then
    echo "creating origin access control"
    oac_id="$(aws cloudfront create-origin-access-control \
        --origin-access-control-config "Name=$oac_name,Description=Static site,SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=s3" \
        --query 'OriginAccessControl.Id' --output text)"
else
    echo "reusing origin access control $oac_id"
fi

function_name="$BUCKET-routing"
function_arn="$(aws cloudfront list-functions \
    --query "FunctionList.Items[?Name=='$function_name'].FunctionMetadata.FunctionARN | [0]" --output text)"

if [ "$function_arn" = "None" ] || [ -z "$function_arn" ]; then
    echo "creating routing function"
    aws cloudfront create-function \
        --name "$function_name" \
        --function-config "Comment=Astro pretty urls,Runtime=cloudfront-js-2.0" \
        --function-code "fileb://aws/cloudfront/rewrite.js" >/dev/null
fi

etag="$(aws cloudfront describe-function --name "$function_name" --query ETag --output text)"
stage="$(aws cloudfront describe-function --name "$function_name" --query 'FunctionSummary.FunctionMetadata.Stage' --output text)"

if [ "$stage" != "LIVE" ]; then
    echo "publishing routing function"
    aws cloudfront publish-function --name "$function_name" --if-match "$etag" >/dev/null
fi

function_arn="$(aws cloudfront describe-function --name "$function_name" \
    --query 'FunctionSummary.FunctionMetadata.FunctionARN' --output text)"

cache_policy="$(aws cloudfront list-cache-policies --type managed \
    --query "CachePolicyList.Items[?CachePolicy.CachePolicyConfig.Name=='Managed-CachingOptimized'].CachePolicy.Id | [0]" \
    --output text)"

existing="$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?Origins.Items[0].DomainName=='$origin_domain'].Id | [0]" --output text 2>/dev/null || echo None)"

if [ "$existing" != "None" ] && [ -n "$existing" ]; then
    echo "distribution already exists: $existing"
    distribution="$existing"
else
    echo "creating distribution"
    config="$(mktemp)"
    cat > "$config" <<JSON
{
  "CallerReference": "$BUCKET-$(date +%s)",
  "Comment": "$BUCKET static site",
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "PriceClass": "PriceClass_100",
  "HttpVersion": "http2and3",
  "IsIPV6Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "s3-$BUCKET",
        "DomainName": "$origin_domain",
        "OriginAccessControlId": "$oac_id",
        "S3OriginConfig": { "OriginAccessIdentity": "" },
        "ConnectionAttempts": 3,
        "ConnectionTimeout": 10
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "s3-$BUCKET",
    "ViewerProtocolPolicy": "redirect-to-https",
    "Compress": true,
    "CachePolicyId": "$cache_policy",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": { "Quantity": 2, "Items": ["GET", "HEAD"] }
    },
    "FunctionAssociations": {
      "Quantity": 1,
      "Items": [{ "EventType": "viewer-request", "FunctionARN": "$function_arn" }]
    }
  },
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      { "ErrorCode": 403, "ResponsePagePath": "/404.html", "ResponseCode": "404", "ErrorCachingMinTTL": 10 },
      { "ErrorCode": 404, "ResponsePagePath": "/404.html", "ResponseCode": "404", "ErrorCachingMinTTL": 10 }
    ]
  }
}
JSON
    distribution="$(aws cloudfront create-distribution --distribution-config "file://$config" \
        --query 'Distribution.Id' --output text)"
    rm -f "$config"
fi

domain="$(aws cloudfront get-distribution --id "$distribution" --query 'Distribution.DomainName' --output text)"

echo "attaching bucket policy"
policy="$(mktemp)"
cat > "$policy" <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontRead",
      "Effect": "Allow",
      "Principal": { "Service": "cloudfront.amazonaws.com" },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::$account:distribution/$distribution"
        }
      }
    }
  ]
}
JSON
aws s3api put-bucket-policy --bucket "$BUCKET" --policy "file://$policy"
rm -f "$policy"

if grep -q '^DISTRIBUTION=' .env.deploy; then
    sed -i "s|^DISTRIBUTION=.*|DISTRIBUTION=$distribution|" .env.deploy
else
    printf 'DISTRIBUTION=%s\n' "$distribution" >> .env.deploy
fi

echo
echo "distribution $distribution"
echo "url          https://$domain"
echo
echo "deployment takes a few minutes to reach all edges, then run: npm run deploy"
