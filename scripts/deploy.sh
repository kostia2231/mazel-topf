#!/usr/bin/env bash
set -euo pipefail

usage() {
    cat <<'TXT'
Deploy the built site to S3 and invalidate CloudFront.

    npm run deploy              build, upload, invalidate
    npm run deploy -- --dry-run show what would change, upload nothing
    npm run deploy -- --yes     skip the confirmation prompt

Settings are read from .env.deploy in the project root:

    BUCKET=maseltopf-site
    DISTRIBUTION=E1234567890ABC
    FORM_ENDPOINT=/api/forms
    SITE_URL=https://restaurant-maseltopf.de
    AWS_PROFILE=maseltopf      optional
    AWS_REGION=eu-central-1    optional

Without SITE_URL the build is marked noindex, which is what a test
distribution wants and a live site does not.
TXT
}

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

dry_run=false
assume_yes=false

for arg in "$@"; do
    case "$arg" in
        --dry-run) dry_run=true ;;
        --yes|-y) assume_yes=true ;;
        --help|-h) usage; exit 0 ;;
        *) echo "unknown argument: $arg" >&2; usage >&2; exit 2 ;;
    esac
done

if [ -f .env.deploy ]; then
    set -a
    . ./.env.deploy
    set +a
fi

missing=()
[ -n "${BUCKET:-}" ] || missing+=(BUCKET)
[ -n "${DISTRIBUTION:-}" ] || missing+=(DISTRIBUTION)
[ -n "${FORM_ENDPOINT:-}" ] || missing+=(FORM_ENDPOINT)

if [ ${#missing[@]} -gt 0 ]; then
    echo "missing settings: ${missing[*]}" >&2
    echo >&2
    usage >&2
    exit 2
fi

command -v aws >/dev/null || { echo "aws cli not found" >&2; exit 1; }

identity="$(aws sts get-caller-identity --query Arn --output text)"

aws s3api head-bucket --bucket "$BUCKET" >/dev/null 2>&1 || {
    echo "bucket not reachable: $BUCKET" >&2
    exit 1
}

aws cloudfront get-distribution --id "$DISTRIBUTION" --query 'Distribution.Status' --output text >/dev/null || {
    echo "distribution not reachable: $DISTRIBUTION" >&2
    exit 1
}

echo "account   $identity"
echo "bucket    s3://$BUCKET"
echo "cdn       $DISTRIBUTION"
echo "forms     $FORM_ENDPOINT"
echo "site      ${SITE_URL:-not set, build will be noindex}"
$dry_run && echo "mode      dry run"
echo

if ! $dry_run && ! $assume_yes; then
    read -r -p "deploy to the above? [y/N] " answer
    [ "$answer" = "y" ] || [ "$answer" = "Y" ] || { echo "cancelled"; exit 1; }
fi

echo "building"
PUBLIC_FORM_ENDPOINT="$FORM_ENDPOINT" URL="${SITE_URL:-}" npm run build

[ -f dist/index.html ] || { echo "dist/index.html missing after build" >&2; exit 1; }

grep -q "$FORM_ENDPOINT" dist/kontakt/index.html || {
    echo "form endpoint did not reach the build" >&2
    exit 1
}

if [ -n "${SITE_URL:-}" ]; then
    grep -q "Allow: /" dist/robots.txt || {
        echo "SITE_URL is set but the build came out noindex" >&2
        exit 1
    }
else
    echo "no SITE_URL: this build is noindex"
fi

flags=(--no-progress)
$dry_run && flags+=(--dryrun)

echo
echo "uploading hashed assets"
aws s3 sync dist/_astro/ "s3://$BUCKET/_astro/" "${flags[@]}" \
    --cache-control "public, max-age=31536000, immutable"

echo
echo "uploading static files"
aws s3 sync dist/ "s3://$BUCKET/" "${flags[@]}" \
    --exclude "_astro/*" \
    --exclude "*.html" \
    --exclude "*.xml" \
    --exclude "*.txt" \
    --exclude "*.webmanifest" \
    --cache-control "public, max-age=86400"

echo
echo "uploading pages"
aws s3 sync dist/ "s3://$BUCKET/" "${flags[@]}" \
    --exclude "*" \
    --include "*.html" \
    --include "*.xml" \
    --include "*.txt" \
    --include "*.webmanifest" \
    --cache-control "no-cache, must-revalidate"

echo
echo "removing files that are no longer built"
aws s3 sync dist/ "s3://$BUCKET/" "${flags[@]}" --size-only --delete

if $dry_run; then
    echo
    echo "dry run finished, nothing was uploaded or invalidated"
    exit 0
fi

echo
echo "invalidating cloudfront"
invalidation="$(aws cloudfront create-invalidation \
    --distribution-id "$DISTRIBUTION" \
    --paths '/*' \
    --query 'Invalidation.Id' --output text)"

echo "invalidation $invalidation created"
echo "done"
