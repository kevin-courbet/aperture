# ADR 0003: Local Package Release

## Status

Superseded by ADR 0008

## Decision

Aperture releases `@kevin-courbet/aperture` as a public npm package. Each
release uses an explicit SemVer version in `packages/charts/package.json`.

Repository CI and npm publication run locally on `beast`. GitHub Actions does
not run this lifecycle. GitHub records `signoff/beast` on the exact candidate
commit.

IQ validates and signs the exact candidate before it lands. Signoff can push a
content-addressed candidate ref, but it must not publish the package.
Publication starts only from a clean `main` checkout that equals `origin/main`
after IQ lands the signed SHA. Build and publication use an isolated checkout
of that SHA.

Unattended publication uses a short-expiry npm granular access token stored in
the local encrypted password store on `beast`. The token has package read/write
access only to the `@kevin-courbet` scope and bypasses publication 2FA. The
release command exposes it only to npm authentication and publication through
temporary mode-600 npm configurations. Validation subprocesses do not receive
the token configuration.

The release command rejects a package version or tag that belongs to a
different commit. A retry can complete a partial release when npm already
records the same landed commit. The command verifies the npm `gitHead` before
it pushes the matching `v<version>` tag.
