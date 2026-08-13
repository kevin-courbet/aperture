# Release

Aperture uses local CI on `beast`. GitHub stores the SHA-bound
`signoff/beast` result. GitHub Actions does not validate or publish the package.

## Prepare A Release

1. Set an unused SemVer version in `packages/charts/package.json`.
2. Run `pnpm validate`.
3. Commit and submit the change through IQ.

IQ validates the exact landing candidate. It pushes only the content-addressed
`signoff/beast/<sha>` ref and posts `signoff/beast` for that SHA. IQ lands only
that signed SHA.

The registered integration checkout must contain this ignored `.iq/config.json`:

```json
{
  "version": 1,
  "integration": {
    "validation": { "command": "CI=true pnpm install --frozen-lockfile && pnpm validate" },
    "signoff": {
      "mode": "required",
      "command": "pnpm signoff:iq",
      "contexts": ["signoff/beast"]
    }
  }
}
```

Run `pnpm signoff:install` once to require this context on `main`. Run
`pnpm signoff:check` to verify the protection.

## Publish A Release

Run this command from the clean `main` integration checkout after IQ lands:

```sh
pnpm release
```

The command reads the npm granular access token from
`pass show npm/aperture-beast-release`. The token must have read/write access
only to the `@kevin-courbet` scope and must bypass 2FA for publication. The
command writes it to a temporary mode-600 npm configuration and removes that
file before it runs validation. It creates another temporary configuration only
for publication and removes it immediately after npm returns.

The command rejects a package version or tag that points to a different commit.
A retry can finish a release that npm already records for the same landed
commit. It also requires `HEAD` to equal `origin/main` and requires trusted
`signoff/beast` success on that exact SHA. It validates again, publishes the
public package, verifies the npm `gitHead`, and pushes the annotated
`v<version>` tag. Build and publication occur in an isolated checkout of the
landed SHA.

Replace the password-store entry when the token expires:

```sh
pass insert --force npm/aperture-beast-release
```
