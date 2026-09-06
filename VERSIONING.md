# Versioning

Every published package in this repo (`asterflow`, everything under `packages/*`, everything under `plugins/*`) is versioned in **lockstep**: they all share the same `X.Y.Z` and move together, one release at a time, even packages with no code changes in that release. One version number across the whole monorepo makes compatibility trivial to reason about - "everything at 2.x works with everything else at 2.x" - instead of having to cross-reference which version of `@asterflow/router` a given version of `@asterflow/fs` actually needs.

The X/Y/Z digits still follow SemVer, with one adjustment for a heavily-generic TypeScript codebase: a **type-only** breaking change is treated the same as a new feature, not the same as a runtime break. Since every release moves every package, what decides X vs Y vs Z for a given release is the single most severe change across ALL packages in it - one package with a runtime break makes it a major release for everyone, even packages that didn't change at all.

- **X (major)** - a breaking **runtime** change. A removed or renamed export, a call signature that changed at the value level, different observable behavior. Existing code that compiled against the old version can now throw, misbehave, or fail to compile because an argument's shape changed.
  - Example: changing `new Method({ method: 'post', ... })` to `new Method('post', { ... })` - the method moved from the options object to a positional argument. Anything calling the old shape breaks. **Major.**
- **Y (minor)** - either of two things:
  - A **type-level** break that doesn't change runtime behavior - generics reshuffled, a type renamed or restructured, something that stops typechecking but would still run the same way if you silenced the error.
  - A new backward-compatible feature or export - the standard SemVer meaning of "minor."
  - Example: collapsing `Method`'s and `Router`'s many generic parameters into a single `Props` object type. Nothing about how a route runs changed, but code that referenced the old generic positions directly no longer typechecks. **Minor.**
- **Z (patch)** - a pure fix or internal change with zero API/type surface impact. Bug fixes, internal refactors, doc updates, build changes. Nothing a consumer's code or types would ever need to change for.

When in doubt, round up: if a change could plausibly break someone's build, it's at least a minor; if it could break something at runtime, it's a major.

## Cutting a release

Releases are published from the **Publish to NPM** GitHub Actions workflow (`.github/workflows/publish.yml`), dispatched manually from the Actions tab (or `gh workflow run publish.yml -f bump=<type>`, **leaving `package` empty** so every package moves together). It runs `bun run check:workspaces`, `bun run typecheck`, then the actual publish, and pushes the resulting version bumps plus a `<name>@<version>` tag per package back to `main`.

```bash
bun run publish --bump <major|minor|patch>
```

`--bump` (`-b`) defaults to `patch` - always pass it explicitly for anything that isn't a pure fix. Since every package starts a release at the same version, applying the same bump type to all of them keeps them in lockstep automatically - there's no separate "set an exact version" mode, and there shouldn't need to be as long as `--package` is never used to single out one package with a different bump than the rest.

`--package <name>` (accepts a folder name like `router`/`fs`, an npm name like `@asterflow/router`, or `core`/`asterflow`) and `--bump none` (skip the version increment, publish whatever's in `package.json` as-is) both still exist, but only for **recovering a package that's out of step** - a first-ever publish, or manually fixing one package after an npm-side hiccup (a burned version number, a stuck Trusted Publisher setup, etc.) - not for normal releases.

Internal `workspace:` dependencies are rewritten to caret ranges (`^X.Y.Z`) at build time, not exact pins - a package doesn't need to be republished just because one of its AsterFlow dependencies shipped a compatible patch or minor release.
