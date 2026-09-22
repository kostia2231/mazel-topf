#!/usr/bin/env bash
set -euo pipefail

usage() {
    cat <<'TXT'
Create the handler behind the /admin page: a Lambda that reads the menu from
GitHub and writes changes back as a commit, reached through the distribution
at /api/admin.

    bash scripts/setup-admin.sh

Reads from .env.deploy:

    DISTRIBUTION      the distribution to attach the route to
    GITHUB_REPO       owner/name
    GITHUB_TOKEN      fine-grained token with contents read and write
    ADMIN_KEY         optional; a new one is generated and printed when unset

The key is never stored in AWS, only its hash. Losing it means running this
script again to set a new one. Safe to re-run.
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

for name in DISTRIBUTION GITHUB_REPO; do
    [ -n "${!name:-}" ] || { echo "$name is not set in .env.deploy" >&2; exit 2; }
done

if [ -z "${GITHUB_TOKEN:-}" ]; then
    echo "GITHUB_TOKEN is not set: the page will open and check the key, but"
    echo "loading and saving the menu will fail until you add the token and"
    echo "run this script again."
    echo
fi

region="${SES_REGION:-eu-central-1}"
account="$(aws sts get-caller-identity --query Account --output text)"
prefix="${ADMIN_LAMBDA_NAME:-maseltopf-admin}"

fresh_key=""
if [ -z "${ADMIN_KEY:-}" ]; then
    ADMIN_KEY="$(python3 -c "import secrets; print(secrets.token_urlsafe(24))")"
    fresh_key="$ADMIN_KEY"
fi
key_hash="$(printf '%s' "$ADMIN_KEY" | sha256sum | cut -d' ' -f1)"

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

bundle="$(mktemp -d)"
cp aws/admin/index.mjs "$bundle/index.mjs"
(cd "$bundle" && npm install --silent --no-package-lock --omit=dev js-yaml >/dev/null 2>&1)
(cd "$bundle" && zip -q -r function.zip index.mjs node_modules)

envfile="$(mktemp)"
ADMIN_KEY_HASH="$key_hash" GITHUB_BRANCH="${GITHUB_BRANCH:-main}" python3 -c "
import json, os, sys
json.dump({'Variables': {
    'GITHUB_TOKEN': os.environ.get('GITHUB_TOKEN', ''),
    'GITHUB_REPO': os.environ['GITHUB_REPO'],
    'GITHUB_BRANCH': os.environ['GITHUB_BRANCH'],
    'ADMIN_KEY_HASH': os.environ['ADMIN_KEY_HASH'],
}}, open(sys.argv[1], 'w'))
" "$envfile"

if aws lambda get-function --function-name "$prefix" --region "$region" >/dev/null 2>&1; then
    echo "updating lambda"
    aws lambda update-function-code --function-name "$prefix" --region "$region" \
        --zip-file "fileb://$bundle/function.zip" >/dev/null
    aws lambda wait function-updated --function-name "$prefix" --region "$region"
    aws lambda update-function-configuration --function-name "$prefix" --region "$region" \
        --environment "file://$envfile" >/dev/null
else
    echo "creating lambda"
    aws lambda create-function --function-name "$prefix" --region "$region" \
        --runtime nodejs22.x --architectures arm64 --handler index.handler \
        --role "$role_arn" --timeout 60 --memory-size 512 \
        --environment "file://$envfile" \
        --zip-file "fileb://$bundle/function.zip" >/dev/null
    aws lambda wait function-active --function-name "$prefix" --region "$region"
fi
rm -rf "$bundle" "$envfile"

url="$(aws lambda get-function-url-config --function-name "$prefix" --region "$region" \
    --query FunctionUrl --output text 2>/dev/null || echo "")"

if [ -z "$url" ]; then
    echo "creating function url"
    url="$(aws lambda create-function-url-config --function-name "$prefix" --region "$region" \
        --auth-type AWS_IAM --query FunctionUrl --output text)"
fi

aws lambda add-permission --function-name "$prefix" --region "$region" \
    --statement-id "cloudfront-url-$DISTRIBUTION" --action lambda:InvokeFunctionUrl \
    --principal cloudfront.amazonaws.com \
    --source-arn "arn:aws:cloudfront::$account:distribution/$DISTRIBUTION" \
    --function-url-auth-type AWS_IAM >/dev/null 2>&1 || true

aws lambda add-permission --function-name "$prefix" --region "$region" \
    --statement-id "cloudfront-invoke-$DISTRIBUTION" --action lambda:InvokeFunction \
    --principal cloudfront.amazonaws.com \
    --source-arn "arn:aws:cloudfront::$account:distribution/$DISTRIBUTION" >/dev/null 2>&1 || true

oac_name="$prefix-oac"
oac="$(aws cloudfront list-origin-access-controls \
    --query "OriginAccessControlList.Items[?Name=='$oac_name'].Id | [0]" --output text)"

if [ "$oac" = "None" ] || [ -z "$oac" ]; then
    echo "creating origin access control"
    oac="$(aws cloudfront create-origin-access-control \
        --origin-access-control-config "Name=$oac_name,Description=Menu admin,SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=lambda" \
        --query 'OriginAccessControl.Id' --output text)"
fi

host="$(echo "$url" | sed -e 's|https://||' -e 's|/$||')"

echo "attaching /api/admin* to $DISTRIBUTION"
current="$(mktemp)"
aws cloudfront get-distribution-config --id "$DISTRIBUTION" > "$current"
etag="$(python3 -c "import json;print(json.load(open('$current'))['ETag'])")"
updated="$(mktemp)"

python3 - "$current" "$updated" "$host" "$oac" <<'PY'
import json, sys

source, target, host, oac = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
config = json.load(open(source))["DistributionConfig"]
origin_id = "lambda-admin"

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
        "OriginReadTimeout": 60,
        "OriginKeepaliveTimeout": 5,
    },
    "ConnectionAttempts": 3,
    "ConnectionTimeout": 10,
    "OriginShield": {"Enabled": False},
})
origins["Quantity"] = len(origins["Items"])

behaviour = {
    "PathPattern": "/api/admin*",
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
items = [b for b in cache.get("Items", []) if b["PathPattern"] != "/api/admin*"]
items.insert(0, behaviour)
config["CacheBehaviors"] = {"Quantity": len(items), "Items": items}

json.dump(config, open(target, "w"))
PY

aws cloudfront update-distribution --id "$DISTRIBUTION" \
    --distribution-config "file://$updated" --if-match "$etag" >/dev/null
rm -f "$current" "$updated"

echo
echo "done"
if [ -n "$fresh_key" ]; then
    cat <<TXT

The key for the admin page, shown once:

    $fresh_key

Keep it in a password manager. To set your own instead, put ADMIN_KEY into
.env.deploy and run this script again.
TXT
fi
