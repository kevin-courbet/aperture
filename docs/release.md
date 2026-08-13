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

The command requires local npm authentication for `kevin-courbet`. It rejects
a package version or tag that points to a different commit. A retry can finish
a release that npm already records for the same landed commit. The command also
requires `HEAD` to equal `origin/main` and requires trusted `signoff/beast`
success on that exact SHA. It validates again, publishes the public package,
verifies the npm `gitHead`, and pushes the annotated `v<version>` tag. Build and
publication occur in an isolated checkout of the landed SHA.

Use interactive authentication when npm credentials expire:

```sh
npm login
```
