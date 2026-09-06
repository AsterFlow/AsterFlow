<div align="center">

# @asterflow/cli

</div>

> Scaffolding and plugin management CLI for AsterFlow projects.

## 📦 Installation

```bash
npm install -g @asterflow/cli
# or run without installing
npx @asterflow/cli init
```

## 🚀 Usage

### `asterflow init [directory]`

Interactively scaffolds a new AsterFlow project: project name, adapter (Bun, Node, Express or Fastify), plugins to install, which example routes to scaffold, whether to initialize a git repository, and whether to install dependencies right away. Checks the target directory is empty (or only has files like `.git`/`.gitignore`/an IDE folder) before writing anything.

```bash
npx @asterflow/cli init my-app
```

Every prompt has an equivalent flag (`--name`, `--adapter`, `--plugins fs,multipart`, `--routes hello,upload`/`--routes none`, `--install`/`--no-install`, `--git`/`--no-git`, `--use-npm`/`--use-pnpm`/`--use-yarn`/`--use-bun`). Passing any flag skips prompting for the rest and uses documented defaults instead - pass `--yes` to always skip prompts entirely:

```bash
npx @asterflow/cli init my-app --adapter bun --plugins fs,multipart --routes hello,upload --yes
```

Route templates: `hello` (`/`) and `upload` (`/upload`, only offered when `multipart` is among the selected plugins). Each maps to a file under `src/routes/`, following `@asterflow/fs`'s folder-based routing.

### `asterflow add <names>`

Adds one or more plugins to an existing project (comma-separated), merging them into `package.json`, installing them with the detected package manager, and printing the `.use(...)` snippet needed to wire each one up.

```bash
npx @asterflow/cli add fs,multipart
```

### `asterflow list`

Prints the available plugins.

```bash
npx @asterflow/cli list
```

### `asterflow generate [directory]`

Generates the static route manifest consumed by `@asterflow/fs` (fs-routing) - scans a routes directory and writes a file with a static import per route, so bundlers can see them (`asterflow init` already wires this into `predev`/`prebuild` for projects that pick the `fs` plugin).

```bash
npx @asterflow/cli generate            # scans src/routes, writes src/routes.gen.ts
npx @asterflow/cli generate --watch    # regenerate on every change
```

## 🔗 Related Packages

- [asterflow](https://www.npmjs.com/package/asterflow) - The core of the AsterFlow framework.
- [@asterflow/router](https://www.npmjs.com/package/@asterflow/router) - The type-safe routing system.

## 📄 License

MIT - See the main project [LICENSE](https://github.com/AsterFlow/AsterFlow/blob/main/LICENSE) for more details.
