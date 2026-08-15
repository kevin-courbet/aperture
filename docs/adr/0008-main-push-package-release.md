# ADR 0008: Main Push Package Release

## Status

Accepted

## Decision

Each push to `main` runs the GitHub Actions `publish.yml` workflow. The workflow
validates the exact commit and publishes the version in
`packages/charts/package.json` when that version is not on npm.

npm trusted publishing authenticates the GitHub-hosted runner through OIDC. The
workflow does not use a long-lived npm token. It verifies that npm `gitHead`
matches the pushed commit and that npm contains the validated package artifact.
Validation, publication, and tagging use separate jobs with only their required
permissions. The workflow creates the matching annotated `v<version>` tag only
after these checks pass.

A version already published from a different commit is an error. Therefore, a
push that changes the release commit must also set an unused SemVer version.
