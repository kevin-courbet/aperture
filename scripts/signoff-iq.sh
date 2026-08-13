#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
expected_host="beast"
expected_repo="kevin-courbet/aperture"
expected_login="kevin-courbet"
expected_signoff_version="gh-signoff 0.2.1"
context="signoff/beast"

fail() {
  printf '%s failed: %s\n' "$context" "$1" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "missing command: $1"
}

require_command gh
require_command git
require_command hostname
require_command jq
require_command node
require_command npm
require_command pnpm

[[ "$(hostname)" == "$expected_host" ]] || fail "must run on $expected_host"
[[ -n "${IQ_SIGNOFF_SHA:-}" ]] || fail "IQ_SIGNOFF_SHA is not set"
[[ -z "$(git -C "$repo_root" status --porcelain)" ]] || fail "working tree has uncommitted changes"

candidate_sha="$(git -C "$repo_root" rev-parse HEAD)"
[[ "$candidate_sha" == "$IQ_SIGNOFF_SHA" ]] || fail "HEAD $candidate_sha does not match IQ candidate $IQ_SIGNOFF_SHA"
[[ "$(git -C "$repo_root" remote get-url origin)" == "git@github.com:${expected_repo}.git" ]] || fail "origin must be $expected_repo"
[[ "$(gh api user --jq .login)" == "$expected_login" ]] || fail "gh must use $expected_login"
gh repo view "$expected_repo" --json nameWithOwner --jq .nameWithOwner >/dev/null || fail "cannot access $expected_repo"
[[ "$(gh signoff version)" == "$expected_signoff_version" ]] || fail "unexpected gh-signoff version"

cd "$repo_root"
CI=true pnpm install --frozen-lockfile >&2
pnpm validate >&2
[[ -z "$(git status --porcelain)" ]] || fail "validation changed the working tree"
[[ "$(git rev-parse HEAD)" == "$candidate_sha" ]] || fail "HEAD changed during validation"

signoff_ref="refs/heads/signoff/beast/$candidate_sha"
remote_sha="$(git ls-remote --refs origin "$signoff_ref" | cut -f1)"
if [[ -n "$remote_sha" && "$remote_sha" != "$candidate_sha" ]]; then
  fail "$signoff_ref already points to $remote_sha"
fi
if [[ -z "$remote_sha" ]]; then
  git push origin "$candidate_sha:$signoff_ref" >&2
fi

gh signoff create -f beast >&2
status="$(gh api "repos/$expected_repo/commits/$candidate_sha/statuses?per_page=100" --jq "[.[] | select(.context == \"$context\")][0]")"
[[ "$(jq -r .state <<<"$status")" == "success" ]] || fail "posted status is not successful"
[[ "$(jq -r .creator.login <<<"$status")" == "$expected_login" ]] || fail "posted status has an unexpected creator"

printf '{"sha":"%s","contexts":{"%s":"success"}}\n' "$candidate_sha" "$context"
