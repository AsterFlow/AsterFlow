<div align="center">

# @asterflow/cli

![license-info](https://img.shields.io/github/license/AsterFlow/AsterFlow?style=for-the-badge&colorA=302D41&colorB=f9e2af&logoColor=f9e2af)
![stars-info](https://img.shields.io/github/stars/AsterFlow/AsterFlow?colorA=302D41&colorB=f9e2af&style=for-the-badge)
![last-commit](https://img.shields.io/github/last-commit/AsterFlow/AsterFlow?path=packages%2Fcli&style=for-the-badge&colorA=302D41&colorB=b4befe)

![bundle-size](https://img.shields.io/bundlejs/size/@asterflow/cli?style=for-the-badge&colorA=302D41&colorB=3ac97b)

</div>

> CLI for scaffolding AsterFlow projects, adding plugins, and generating the static fs-routing manifest.

## 📦 Installation

```bash
bunx @asterflow/cli@latest init my-app
```

### ✨ Features

- **Full project scaffolding**: `init` writes `package.json`, `tsconfig.json`, `.gitignore`, an app entry for the chosen adapter (Bun, Node, Express or Fastify), and example route files - interactively or entirely via flags.
- **Non-interactive by default when it needs to be**: any `--flag`, CI, or `--yes` skips prompting and fills in documented defaults instead, so agents and CI never hang waiting on input.
- **Empty-directory check**: refuses to scaffold into a non-empty directory (ignoring things like `.git`/`.gitignore`/an IDE folder).
- **Plugin management**: `add` merges plugins into an existing project's `package.json`, installs them with the detected package manager, and prints the `.use(...)` snippet to wire each one up.
- **Route templates**: `hello` (a minimal `GET /`) and `upload` (a file upload via `@asterflow/multipart`, only offered when the `multipart` plugin is selected).
- **Static route manifest generation**: `generate` calls `@asterflow/fs`'s `generateRouteManifest` to turn a `routes/` directory into a manifest of static imports, with a `--watch` mode to regenerate on change.

## ❓ How to Use

Scaffold a new project - interactively, or fully via flags for CI/agents:

```bash
bunx @asterflow/cli@latest init my-app --adapter bun --plugins fs,multipart --routes hello,upload --yes
```

Manage an existing project with the other commands:

```bash
asterflow add fs,multipart   # add plugins to package.json, install them, print .use(...) wiring
asterflow list                # print available plugins
asterflow generate --watch    # regenerate src/routes.gen.ts whenever src/routes/ changes
```

## 🔗 Related Packages

- [@asterflow/fs](https://www.npmjs.com/package/@asterflow/fs) - its `generateRouteManifest` powers the `generate` command.

## 📄 License

This project is licensed under the [MIT License](../../LICENSE).
