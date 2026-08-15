# Release

Aperture publishes from GitHub Actions after a commit reaches `main`. npm
trusted publishing authenticates `.github/workflows/publish.yml` through OIDC.

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

Before the first push, configure the npm trusted publisher with:

- Organization or user: `kevin-courbet`
- Repository: `aperture`
- Workflow filename: `publish.yml`
- Allowed action: `npm publish`

Push the signed release commit to `main`. The `Publish` workflow installs from
the frozen lockfile, runs `pnpm validate`, and creates one verified package
artifact that records the release commit. A separate OIDC job publishes that
artifact only when the version is unused. The workflow verifies npm `gitHead`
and package integrity before a third job creates the matching annotated
`v<version>` tag.

The workflow rejects a version already published from a different commit. Set a
new SemVer version before every release commit.

After the first OIDC release succeeds, revoke the old npm automation token. Set
package access to require two-factor authentication and disallow token-based
publication.
