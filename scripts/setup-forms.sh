#!/usr/bin/env bash
set -euo pipefail

usage() {
    cat <<'TXT'
Create the mail path for the site forms: SES identity, Lambda, function url,
and the /api/* behaviour on the distribution.

    bash scripts/setup-forms.sh

Reads from .env.deploy:

    BUCKET, DISTRIBUTION   as used by the deploy
    MAIL_DOMAIN            domain to send from, e.g. restaurant-maseltopf.de
    MAIL_FROM              e.g. noreply@restaurant-maseltopf.de
    MAIL_TO                where the forms land

DKIM records are written into Route 53 when a hosted zone for MAIL_DOMAIN
exists. Safe to re-run.
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

[ -f .env.deploy ] || { echo ".env.deploy not found" >&2; exit 2; }
set -a
. ./.env.deploy
set +a

for name in DISTRIBUTION MAIL_DOMAIN MAIL_FROM MAIL_TO; do
    [ -n "${!name:-}" ] || { echo "$name is not set in .env.deploy" >&2; exit 2; }
done

region="${SES_REGION:-eu-central-1}"
account="$(aws sts get-caller-identity --query Account --output text)"
prefix="${LAMBDA_NAME:-maseltopf-forms}"

echo "account   $account"
echo "region    $region"
echo "from      $MAIL_FROM"
echo "to        $MAIL_TO"
echo

if ! aws sesv2 get-email-identity --region "$region" --email-identity "$MAIL_DOMAIN" >/dev/null 2>&1; then
    echo "creating ses identity for $MAIL_DOMAIN"
    aws sesv2 create-email-identity --region "$region" --email-identity "$MAIL_DOMAIN" >/dev/null
fi

tokens="$(aws sesv2 get-email-identity --region "$region" --email-identity "$MAIL_DOMAIN" \
    --query 'DkimAttributes.Tokens' --output text)"

zone="$(aws route53 list-hosted-zones --query "HostedZones[?Name=='$MAIL_DOMAIN.'].Id | [0]" --output text)"

if [ "$zone" != "None" ] && [ -n "$zone" ]; then
    echo "writing dkim records into route 53"
    changes=""
    for token in $tokens; do
        changes="$changes{\"Action\":\"UPSERT\",\"ResourceRecordSet\":{\"Name\":\"$token._domainkey.$MAIL_DOMAIN\",\"Type\":\"CNAME\",\"TTL\":1800,\"ResourceRecords\":[{\"Value\":\"$token.dkim.amazonses.com\"}]}},"
    done
    batch="$(mktemp)"
    printf '{"Changes":[%s]}' "${changes%,}" > "$batch"
    aws route53 change-resource-record-sets --hosted-zone-id "$zone" --change-batch "file://$batch" >/dev/null
    rm -f "$batch"
else
    echo "no route 53 zone for $MAIL_DOMAIN, add these CNAMEs by hand:"
    for token in $tokens; do
        echo "  $token._domainkey.$MAIL_DOMAIN  ->  $token.dkim.amazonses.com"
    done
fi

if ! aws sesv2 get-email-identity --region "$region" --email-identity "$MAIL_TO" >/dev/null 2>&1; then
    echo "sending a verification mail to $MAIL_TO"
    aws sesv2 create-email-identity --region "$region" --email-identity "$MAIL_TO" >/dev/null
fi

role_name="$prefix-role"
role_arn="$(aws iam get-role --role-name "$role_name" --query 'Role.Arn' --output text 2>/dev/null || echo "")"

if [ -z "$role_arn" ]; then
    echo "creating lambda role"
    trust="$(mktemp)"
    cat > "$trust" <<'JSON'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "lambda.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
JSON
    role_arn="$(aws iam create-role --role-name "$role_name" \
        --assume-role-policy-document "file://$trust" --query 'Role.Arn' --output text)"
    rm -f "$trust"
    aws iam attach-role-policy --role-name "$role_name" \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
    sleep 10
fi

send="$(mktemp)"
cat > "$send" <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "ses:SendEmail",
      "Resource": "*",
      "Condition": {
        "StringEquals": { "ses:FromAddress": "$MAIL_FROM" }
      }
    }
  ]
}
JSON
aws iam put-role-policy --role-name "$role_name" --policy-name send-mail --policy-document "file://$send"
rm -f "$send"

envfile="$(mktemp)"
python3 -c "import json,os,sys; json.dump({'Variables':{'MAIL_FROM':os.environ['MAIL_FROM'],'MAIL_TO':os.environ['MAIL_TO'],'ALLOWED_ORIGINS':os.environ.get('ALLOWED_ORIGINS','')}}, open(sys.argv[1],'w'))" "$envfile"

bundle="$(mktemp -d)"
cp aws/forms/index.mjs "$bundle/index.mjs"
zip -j -q "$bundle/function.zip" "$bundle/index.mjs"

if aws lambda get-function --function-name "$prefix" --region "$region" >/dev/null 2>&1; then
    echo "updating lambda code"
    aws lambda update-function-code --function-name "$prefix" --region "$region" \
        --zip-file "fileb://$bundle/function.zip" >/dev/null
    aws lambda wait function-updated --function-name "$prefix" --region "$region"
    aws lambda update-function-configuration --function-name "$prefix" --region "$region" \
        --environment "file://$envfile" >/dev/null
else
    echo "creating lambda"
    aws lambda create-function --function-name "$prefix" --region "$region" \
        --runtime nodejs22.x --architectures arm64 --handler index.handler \
        --role "$role_arn" --timeout 10 --memory-size 256 \
        --environment "file://$envfile" \
        --zip-file "fileb://$bundle/function.zip" >/dev/null
    aws lambda wait function-active --function-name "$prefix" --region "$region"
    aws lambda put-function-concurrency --function-name "$prefix" --region "$region" \
        --reserved-concurrent-executions 5 >/dev/null 2>&1 \
        || echo "account concurrency too low for a reserved cap, skipping" 
fi
rm -rf "$bundle" "$envfile"

url="$(aws lambda get-function-url-config --function-name "$prefix" --region "$region" \
    --query FunctionUrl --output text 2>/dev/null || echo "")"

if [ -z "$url" ]; then
    echo "creating function url"
    url="$(aws lambda create-function-url-config --function-name "$prefix" --region "$region" \
        --auth-type AWS_IAM --query FunctionUrl --output text)"
else
    aws lambda update-function-url-config --function-name "$prefix" --region "$region" \
        --auth-type AWS_IAM >/dev/null
fi

aws lambda remove-permission --function-name "$prefix" --region "$region" \
    --statement-id public-function-url >/dev/null 2>&1 || true

aws lambda add-permission --function-name "$prefix" --region "$region" \
    --statement-id "cloudfront-$DISTRIBUTION" --action lambda:InvokeFunctionUrl \
    --principal cloudfront.amazonaws.com \
    --source-arn "arn:aws:cloudfront::$account:distribution/$DISTRIBUTION" \
    --function-url-auth-type AWS_IAM >/dev/null 2>&1 || true

aws lambda add-permission --function-name "$prefix" --region "$region" \
    --statement-id "cloudfront-invoke-$DISTRIBUTION" --action lambda:InvokeFunction \
    --principal cloudfront.amazonaws.com \
    --source-arn "arn:aws:cloudfront::$account:distribution/$DISTRIBUTION" >/dev/null 2>&1 || true

lambda_oac_name="$prefix-oac"
lambda_oac="$(aws cloudfront list-origin-access-controls \
    --query "OriginAccessControlList.Items[?Name=='$lambda_oac_name'].Id | [0]" --output text)"

if [ "$lambda_oac" = "None" ] || [ -z "$lambda_oac" ]; then
    echo "creating origin access control for the lambda"
    lambda_oac="$(aws cloudfront create-origin-access-control \
        --origin-access-control-config "Name=$lambda_oac_name,Description=Form handler,SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=lambda" \
        --query 'OriginAccessControl.Id' --output text)"
fi

host="$(echo "$url" | sed -e 's|https://||' -e 's|/$||')"
echo "function url $url"

echo "attaching /api/* behaviour to $DISTRIBUTION"
current="$(mktemp)"
aws cloudfront get-distribution-config --id "$DISTRIBUTION" > "$current"
etag="$(python3 -c "import json,sys; print(json.load(open('$current'))['ETag'])")"
updated="$(mktemp)"

python3 - "$current" "$updated" "$host" "$lambda_oac" <<'PY'
import json, sys

source, target, host, oac = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
config = json.load(open(source))["DistributionConfig"]
origin_id = "lambda-forms"

origins = config["Origins"]
origins["Items"] = [o for o in origins["Items"] if o["Id"] != origin_id]
origins["Items"].append({
    "Id": origin_id,
    "DomainName": host,
    "OriginAccessControlId": oac,
    "OriginPath": "",
    "CustomHeaders": {"Quantity": 0},
    "CustomOriginConfig": {
        "HTTPPort": 80,
        "HTTPSPort": 443,
        "OriginProtocolPolicy": "https-only",
        "OriginSslProtocols": {"Quantity": 1, "Items": ["TLSv1.2"]},
        "OriginReadTimeout": 30,
        "OriginKeepaliveTimeout": 5,
    },
    "ConnectionAttempts": 3,
    "ConnectionTimeout": 10,
    "OriginShield": {"Enabled": False},
})
origins["Quantity"] = len(origins["Items"])

behaviour = {
    "PathPattern": "/api/*",
    "TargetOriginId": origin_id,
    "ViewerProtocolPolicy": "redirect-to-https",
    "Compress": True,
    "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
    "OriginRequestPolicyId": "b689b0a8-53d0-40ab-baf2-68738e2966ac",
    "AllowedMethods": {
        "Quantity": 7,
        "Items": ["GET", "HEAD", "POST", "PUT", "PATCH", "OPTIONS", "DELETE"],
        "CachedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"]},
    },
    "SmoothStreaming": False,
    "FieldLevelEncryptionId": "",
    "LambdaFunctionAssociations": {"Quantity": 0, "Items": []},
    "FunctionAssociations": {"Quantity": 0, "Items": []},
    "TrustedSigners": {"Enabled": False, "Quantity": 0, "Items": []},
    "TrustedKeyGroups": {"Enabled": False, "Quantity": 0, "Items": []},
}

cache = config.get("CacheBehaviors", {"Quantity": 0, "Items": []})
items = [b for b in cache.get("Items", []) if b["PathPattern"] != "/api/*"]
items.append(behaviour)
config["CacheBehaviors"] = {"Quantity": len(items), "Items": items}

json.dump(config, open(target, "w"))
PY

aws cloudfront update-distribution --id "$DISTRIBUTION" \
    --distribution-config "file://$updated" --if-match "$etag" >/dev/null
rm -f "$current" "$updated"

echo
echo "done"
echo "dkim verification takes a few minutes; check with:"
echo "  aws sesv2 get-email-identity --region $region --email-identity $MAIL_DOMAIN --query VerifiedForSendingStatus"
