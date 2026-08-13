#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
package_directory="$repo_root/packages/charts"
expected_host="beast"
expected_repo="kevin-courbet/aperture"
expected_login="kevin-courbet"
context="signoff/beast"
registry="https://registry.npmjs.org/"
release_root=""

fail() {
  printf 'release failed: %s\n' "$1" >&2
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

cleanup() {
  if [[ -n "$release_root" && -d "$release_root" ]]; then
    rm -rf "$release_root"
  fi
}

trap cleanup EXIT

[[ "$(hostname)" == "$expected_host" ]] || fail "must run on $expected_host"
[[ -z "$(git -C "$repo_root" status --porcelain)" ]] || fail "working tree has uncommitted changes"
[[ "$(git -C "$repo_root" symbolic-ref --quiet --short HEAD)" == "main" ]] || fail "must run from main"
[[ "$(git -C "$repo_root" remote get-url origin)" == "git@github.com:${expected_repo}.git" ]] || fail "origin must be $expected_repo"
[[ "$(gh api user --jq .login)" == "$expected_login" ]] || fail "gh must use $expected_login"
[[ "$(npm whoami --registry="$registry")" == "$expected_login" ]] || fail "npm must use $expected_login"

git -C "$repo_root" fetch origin '+refs/heads/main:refs/remotes/origin/main' --tags
release_sha="$(git -C "$repo_root" rev-parse HEAD)"
main_sha="$(git -C "$repo_root" rev-parse origin/main)"
[[ "$release_sha" == "$main_sha" ]] || fail "HEAD $release_sha is not origin/main $main_sha"

status="$(gh api "repos/$expected_repo/commits/$release_sha/statuses?per_page=100" --jq "[.[] | select(.context == \"$context\")][0]")"
[[ "$(jq -r .state <<<"$status")" == "success" ]] || fail "$release_sha has no successful $context"
[[ "$(jq -r .creator.login <<<"$status")" == "$expected_login" ]] || fail "$context has an unexpected creator"

package_name="$(node -p "require('$package_directory/package.json').name")"
package_version="$(node -p "require('$package_directory/package.json').version")"
tag="v$package_version"
release_root="$(mktemp -d)"
registry_output="$release_root/registry.json"
registry_error="$release_root/registry-error.log"

set +e
npm view "$package_name@$package_version" --json --registry="$registry" >"$registry_output" 2>"$registry_error"
registry_status=$?
set -e
registry_result="$(<"$registry_output")"
if [[ $registry_status -eq 0 ]]; then
  existing_package_sha="$(jq -r '.gitHead // empty' <<<"$registry_result")"
  [[ -n "$existing_package_sha" ]] || fail "$package_name@$package_version has no gitHead"
elif [[ "$(jq -r '.error.code // empty' <<<"$registry_result" 2>/dev/null || true)" == "E404" ]]; then
  existing_package_sha=""
else
  fail "npm registry query failed: $(<"$registry_error")"
fi
if [[ -n "$existing_package_sha" && "$existing_package_sha" != "$release_sha" ]]; then
  fail "$package_name@$package_version was published from $existing_package_sha"
fi
if git -C "$repo_root" show-ref --verify --quiet "refs/tags/$tag"; then
  tag_sha="$(git -C "$repo_root" rev-parse "$tag^{commit}")"
  [[ "$tag_sha" == "$release_sha" ]] || fail "tag $tag points to $tag_sha"
fi

release_checkout="$release_root/aperture"
git clone --no-checkout --no-hardlinks "$repo_root" "$release_checkout"
git -C "$release_checkout" remote set-url origin "git@github.com:${expected_repo}.git"
git -C "$release_checkout" checkout --detach "$release_sha"
[[ "$(git -C "$release_checkout" rev-parse HEAD)" == "$release_sha" ]] || fail "isolated checkout has the wrong commit"
[[ -z "$(git -C "$release_checkout" status --porcelain)" ]] || fail "isolated checkout is not clean"

cd "$release_checkout"
CI=true pnpm install --frozen-lockfile
pnpm validate
[[ "$(git rev-parse HEAD)" == "$release_sha" ]] || fail "isolated HEAD changed during validation"
[[ -z "$(git status --porcelain)" ]] || fail "validation changed the isolated checkout"
git fetch origin '+refs/heads/main:refs/remotes/origin/main'
[[ "$(git rev-parse origin/main)" == "$release_sha" ]] || fail "origin/main changed before publication"

if [[ -z "$existing_package_sha" ]]; then
  cd "$release_checkout/packages/charts"
  set +e
  npm publish --access public --registry="$registry"
  publish_status=$?
  set -e
else
  publish_status=0
fi

published_version=""
published_sha=""
registry_result=""
for _attempt in {1..12}; do
  set +e
  npm view "$package_name@$package_version" --json --registry="$registry" >"$registry_output" 2>"$registry_error"
  registry_status=$?
  set -e
  registry_result="$(<"$registry_output")"
  if [[ $registry_status -eq 0 ]]; then
    published_version="$(jq -r '.version // empty' <<<"$registry_result")"
    published_sha="$(jq -r '.gitHead // empty' <<<"$registry_result")"
    if [[ "$published_version" == "$package_version" && "$published_sha" == "$release_sha" ]]; then
      break
    fi
  else
    registry_error_code="$(jq -r '.error.code // empty' <<<"$registry_result" 2>/dev/null || true)"
    case "$registry_error_code" in
      E404|E408|E429|E500|E502|E503|E504) ;;
      *) fail "npm registry verification failed: $(<"$registry_error")" ;;
    esac
  fi
  sleep 5
done
if [[ $publish_status -ne 0 && "$published_sha" != "$release_sha" ]]; then
  fail "npm publish failed and the registry did not confirm $release_sha"
fi
[[ "$published_version" == "$package_version" ]] || fail "npm returned version $published_version"
[[ "$published_sha" == "$release_sha" ]] || fail "npm gitHead $published_sha does not match $release_sha"

if ! git -C "$release_checkout" show-ref --verify --quiet "refs/tags/$tag"; then
  git -C "$release_checkout" tag -a "$tag" "$release_sha" -m "Release $package_name@$package_version"
fi
git -C "$release_checkout" push origin "refs/tags/$tag"
printf 'Published %s@%s from %s and pushed %s.\n' "$package_name" "$package_version" "$release_sha" "$tag"
