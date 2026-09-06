<div align="center">

# @asterflow/fs

![license-info](https://img.shields.io/github/license/AsterFlow/AsterFlow?style=for-the-badge&colorA=302D41&colorB=f9e2af&logoColor=f9e2af)
![stars-info](https://img.shields.io/github/stars/AsterFlow/AsterFlow?colorA=302D41&colorB=f9e2af&style=for-the-badge)
![last-commit](https://img.shields.io/github/last-commit/AsterFlow/AsterFlow?path=plugins%2Ffs&style=for-the-badge&colorA=302D41&colorB=b4befe)

![bundle-size](https://img.shields.io/bundlejs/size/@asterflow/fs?style=for-the-badge&colorA=302D41&colorB=3ac97b)

</div>

> Generates a static route manifest from a file-based `routes/` directory and registers it on an AsterFlow app as a plugin.

## 📦 Installation

```bash
bun install @asterflow/fs
```

Register the plugin with a generated route manifest:

```ts
import { AsterFlow } from 'asterflow'
import { fsRoutingPlugin } from '@asterflow/fs'
import routes from './routes.gen'

const app = new AsterFlow()
  .use(fsRoutingPlugin, { routes })
```

### ✨ Features

- **Static manifest, not runtime scanning**: `generateRouteManifest` walks a routes directory once and writes a file with one literal `import` per route plus a default-exported array - a bundler can follow these imports, unlike the old `await import(dynamicPath)` approach.
- **File-to-URL conventions**: `index.ts` becomes `/`, `users/index.ts` becomes `/users`, and a `$`-prefixed segment like `$id.ts` becomes a `:id` param.
- **Auto path assignment**: in the generated manifest, any route whose `default export` has no explicit `path` gets one assigned from its file location.
- **Safe registration**: `fsRoutingPlugin` registers every entry in `routes` with `instance.controller(route)` on `beforeInitialize`, and skips (with a warning) any entry that isn't a `Method`/`Router` instance instead of throwing.

## ❓ How to Use

Generate the manifest ahead of time, usually via the `asterflow generate` CLI command, or by calling the generator directly from a build script:

```ts
import { generateRouteManifest } from '@asterflow/fs'

await generateRouteManifest({
  routesDir: './src/routes',
  outFile: './src/routes.gen.ts'
})
```

Route files just export a `Method` or `Router` - the `path` is filled in by the generator from the file's location, so `src/routes/users/$id.ts` becomes `/users/:id`:

```ts
// src/routes/users/$id.ts
import { Method } from '@asterflow/router'

export default new Method(Method.GET, {
  handler: ({ url, response }) => response.success({ id: url.getParams().id })
})
```

## 🔗 Related Packages

- [@asterflow/plugin](https://www.npmjs.com/package/@asterflow/plugin) - builds `fsRoutingPlugin` via `Plugin.create()`.
- [@asterflow/router](https://www.npmjs.com/package/@asterflow/router) - provides the `Method`/`Router` classes that route files export and that the plugin registers.
- Depended on by `@asterflow/cli` - its `generate` command calls this package's `generateRouteManifest` to produce the route manifest.

## 📄 License

This project is licensed under the [MIT License](../../LICENSE).
