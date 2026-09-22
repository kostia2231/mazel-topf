#!/usr/bin/env bash
set -euo pipefail

usage() {
    cat <<'TXT'
Let GitHub Actions deploy without storing AWS keys, by trusting GitHub's
OIDC provider and creating a role scoped to this repository.

    bash scripts/setup-github-oidc.sh

Reads BUCKET, DISTRIBUTION and GITHUB_REPO (owner/name) from .env.deploy.
Prints the role arn to put into the repository variables. Safe to re-run.
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

for name in BUCKET DISTRIBUTION GITHUB_REPO; do
    [ -n "${!name:-}" ] || { echo "$name is not set in .env.deploy" >&2; exit 2; }
done

account="$(aws sts get-caller-identity --query Account --output text)"
provider="arn:aws:iam::$account:oidc-provider/token.actions.githubusercontent.com"

if ! aws iam get-open-id-connect-provider --open-id-connect-provider-arn "$provider" >/dev/null 2>&1; then
    echo "creating the github oidc provider"
    aws iam create-open-id-connect-provider \
        --url https://token.actions.githubusercontent.com \
        --client-id-list sts.amazonaws.com \
        --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 >/dev/null
fi

role_name="${GITHUB_ROLE:-maseltopf-deploy}"
repo_owner="${GITHUB_REPO%%/*}"
repo_name="${GITHUB_REPO##*/}"

trust="$(mktemp)"
cat > "$trust" <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Federated": "$provider" },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:repository": "$GITHUB_REPO"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": [
            "repo:$GITHUB_REPO:*",
            "repo:$repo_owner@*/$repo_name@*:*"
          ]
        }
      }
    }
  ]
}
JSON

if aws iam get-role --role-name "$role_name" >/dev/null 2>&1; then
    aws iam update-assume-role-policy --role-name "$role_name" \
        --policy-document "file://$trust" >/dev/null
else
    echo "creating role $role_name"
    aws iam create-role --role-name "$role_name" \
        --assume-role-policy-document "file://$trust" >/dev/null
fi
rm -f "$trust"

policy="$(mktemp)"
cat > "$policy" <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket", "s3:GetBucketLocation"],
      "Resource": "arn:aws:s3:::$BUCKET"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::$BUCKET/*"
    },
    {
      "Effect": "Allow",
      "Action": ["cloudfront:CreateInvalidation", "cloudfront:GetDistribution"],
      "Resource": "arn:aws:cloudfront::$account:distribution/$DISTRIBUTION"
    }
  ]
}
JSON
aws iam put-role-policy --role-name "$role_name" --policy-name deploy \
    --policy-document "file://$policy"
rm -f "$policy"

arn="$(aws iam get-role --role-name "$role_name" --query 'Role.Arn' --output text)"

cat <<TXT

role ready: $arn

Put these into the repository, Settings -> Secrets and variables -> Actions,
on the Variables tab:

  AWS_ROLE_ARN    $arn
  BUCKET          $BUCKET
  DISTRIBUTION    $DISTRIBUTION
  FORM_ENDPOINT   ${FORM_ENDPOINT:-/api/forms}
  SITE_URL        ${SITE_URL:-<empty until the live domain is switched>}

SITE_URL decides whether the build is indexable, so leave it empty while the
distribution is only a test address.
TXT
