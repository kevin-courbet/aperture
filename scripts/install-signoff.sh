#!/usr/bin/env bash
set -euo pipefail

mode="${1:-check}"
repo="kevin-courbet/aperture"
branch="main"
context="signoff/beast"
expected_login="kevin-courbet"
expected_signoff_version="gh-signoff 0.2.1"

fail() {
  printf 'signoff installation failed: %s\n' "$1" >&2
  exit 1
}

[[ "$mode" == "install" || "$mode" == "check" ]] || fail "usage: $0 [install|check]"
[[ "$(gh api user --jq .login)" == "$expected_login" ]] || fail "gh must use $expected_login"
gh repo view "$repo" --json nameWithOwner --jq .nameWithOwner >/dev/null || fail "cannot access $repo"
[[ "$(gh signoff version)" == "$expected_signoff_version" ]] || fail "unexpected gh-signoff version"

verify_protection() {
  local protection="$1"
  jq -e --arg context "$context" \
    '.enforce_admins.enabled == true and .required_status_checks.strict == true and (.required_status_checks.contexts | index($context) != null)' \
    <<<"$protection" >/dev/null || fail "$branch must strictly require $context"
}

if protection="$(gh api "repos/$repo/branches/$branch/protection" 2>/dev/null)"; then
  if [[ "$mode" == "install" ]]; then
    jq --arg context "$context" '{
      strict: true,
      contexts: ((.required_status_checks.contexts // []) + [$context] | unique),
      checks: (.required_status_checks.checks // [])
    }' <<<"$protection" | gh api --method PATCH \
      "repos/$repo/branches/$branch/protection/required_status_checks" \
      --input - >/dev/null
    gh api --method POST "repos/$repo/branches/$branch/protection/enforce_admins" >/dev/null
    protection="$(gh api "repos/$repo/branches/$branch/protection")"
  fi
else
  [[ "$mode" == "install" ]] || fail "$branch has no branch protection"
  gh signoff install beast --branch "$branch"
  protection="$(gh api "repos/$repo/branches/$branch/protection")"
  jq --arg context "$context" '{
    strict: true,
    contexts: ((.required_status_checks.contexts // []) + [$context] | unique),
    checks: (.required_status_checks.checks // [])
  }' <<<"$protection" | gh api --method PATCH \
    "repos/$repo/branches/$branch/protection/required_status_checks" \
    --input - >/dev/null
  gh api --method POST "repos/$repo/branches/$branch/protection/enforce_admins" >/dev/null
  protection="$(gh api "repos/$repo/branches/$branch/protection")"
fi

verify_protection "$protection"
printf 'GitHub %s strictly requires %s.\n' "$branch" "$context"
