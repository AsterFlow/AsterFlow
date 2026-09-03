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

Interactively scaffolds a new AsterFlow project: project name, adapter (Bun, Node, Express or Fastify), plugins to install, whether to generate example routes, and whether to install dependencies right away.

```bash
npx @asterflow/cli init my-app
```

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

## 🔗 Related Packages

- [asterflow](https://www.npmjs.com/package/asterflow) - The core of the AsterFlow framework.
- [@asterflow/router](https://www.npmjs.com/package/@asterflow/router) - The type-safe routing system.

## 📄 License

MIT - See the main project [LICENSE](https://github.com/AsterFlow/AsterFlow/blob/main/LICENSE) for more details.
