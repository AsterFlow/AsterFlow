# Versioning

Every published package in this repo (`asterflow`, everything under `packages/*`, everything under `plugins/*`) follows SemVer (`X.Y.Z`), with one adjustment for a heavily-generic TypeScript codebase: a **type-only** breaking change is treated the same as a new feature, not the same as a runtime break.

- **X (major)** - a breaking **runtime** change. A removed or renamed export, a call signature that changed at the value level, different observable behavior. Existing code that compiled against the old version can now throw, misbehave, or fail to compile because an argument's shape changed.
  - Example: changing `new Method({ method: 'post', ... })` to `new Method('post', { ... })` - the method moved from the options object to a positional argument. Anything calling the old shape breaks. **Major.**
- **Y (minor)** - either of two things:
  - A **type-level** break that doesn't change runtime behavior - generics reshuffled, a type renamed or restructured, something that stops typechecking but would still run the same way if you silenced the error.
  - A new backward-compatible feature or export - the standard SemVer meaning of "minor."
  - Example: collapsing `Method`'s and `Router`'s many generic parameters into a single `Props` object type. Nothing about how a route runs changed, but code that referenced the old generic positions directly no longer typechecks. **Minor.**
- **Z (patch)** - a pure fix or internal change with zero API/type surface impact. Bug fixes, internal refactors, doc updates, build changes. Nothing a consumer's code or types would ever need to change for.

When in doubt, round up: if a change could plausibly break someone's build, it's at least a minor; if it could break something at runtime, it's a major.

## Cutting a release

Releases are published from the **Publish to NPM** GitHub Actions workflow (`.github/workflows/publish.yml`), dispatched manually from the Actions tab (or `gh workflow run publish.yml -f package=<name> -f bump=<type>`). It runs `bun run check:workspaces`, `bun run typecheck`, then the actual publish, and pushes the resulting version bump plus a `<name>@<version>` tag back to `main`.

The workflow (and the underlying script, for local/manual use) both take:

```bash
bun run publish --package <name> --bump <major|minor|patch|none>
```

- `--package` (`-p`) accepts a folder name (`router`, `fs`), an npm name (`@asterflow/router`), or `core`/`asterflow`. Omit it to publish every package.
- `--bump` (`-b`) defaults to `patch` - always pass it explicitly for anything that isn't a pure fix. `none` skips the version increment entirely and publishes whatever is already in `package.json` - only for a package's genuine first release, where there's no prior published version to bump from.

Internal `workspace:` dependencies are rewritten to caret ranges (`^X.Y.Z`) at build time, not exact pins - a package doesn't need to be republished just because one of its AsterFlow dependencies shipped a compatible patch or minor release.
