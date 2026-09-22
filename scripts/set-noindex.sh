#!/usr/bin/env bash
set -euo pipefail

usage() {
    cat <<'TXT'
Add an X-Robots-Tag: noindex header to a distribution, so a test address
cannot end up in search results even if someone links to it.

    bash scripts/set-noindex.sh

Uses DISTRIBUTION from .env.deploy. Never run this against the live domain.
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

[ -n "${DISTRIBUTION:-}" ] || { echo "DISTRIBUTION is not set" >&2; exit 2; }

name="noindex"
policy="$(aws cloudfront list-response-headers-policies --type custom \
    --query "ResponseHeadersPolicyList.Items[?ResponseHeadersPolicy.ResponseHeadersPolicyConfig.Name=='$name'].ResponseHeadersPolicy.Id | [0]" \
    --output text)"

if [ "$policy" = "None" ] || [ -z "$policy" ]; then
    echo "creating response headers policy"
    config="$(mktemp)"
    cat > "$config" <<'JSON'
{
  "Name": "noindex",
  "Comment": "Keeps test distributions out of search results",
  "CustomHeadersConfig": {
    "Quantity": 1,
    "Items": [
      { "Header": "X-Robots-Tag", "Value": "noindex, nofollow", "Override": true }
    ]
  }
}
JSON
    policy="$(aws cloudfront create-response-headers-policy \
        --response-headers-policy-config "file://$config" \
        --query 'ResponseHeadersPolicy.Id' --output text)"
    rm -f "$config"
fi

current="$(mktemp)"
aws cloudfront get-distribution-config --id "$DISTRIBUTION" > "$current"
etag="$(python3 -c "import json;print(json.load(open('$current'))['ETag'])")"
updated="$(mktemp)"

python3 - "$current" "$updated" "$policy" <<'PY'
import json, sys

source, target, policy = sys.argv[1], sys.argv[2], sys.argv[3]
config = json.load(open(source))["DistributionConfig"]
config["DefaultCacheBehavior"]["ResponseHeadersPolicyId"] = policy
json.dump(config, open(target, "w"))
PY

aws cloudfront update-distribution --id "$DISTRIBUTION" \
    --distribution-config "file://$updated" --if-match "$etag" >/dev/null
rm -f "$current" "$updated"

echo "X-Robots-Tag attached to $DISTRIBUTION"
