<div align="center">

# @asterflow/fs

![license-info](https://img.shields.io/github/license/AsterFlow/AsterFlow?style=for-the-badge&colorA=302D41&colorB=f9e2af&logoColor=f9e2af)
![stars-info](https://img.shields.io/github/stars/AsterFlow/AsterFlow?colorA=302D41&colorB=f9e2af&style=for-the-badge)
![last-commit](https://img.shields.io/github/last-commit/AsterFlow/AsterFlow?path=plugins%2Ffs&style=for-the-badge&colorA=302D41&colorB=b4befe)

![bundle-size](https://img.shields.io/bundlejs/size/@asterflow/fs?style=for-the-badge&colorA=302D41&colorB=3ac97b)

</div>

> File-based routing for AsterFlow - dynamic (scan a directory at startup) or static (a pre-generated manifest, bundler-safe) - registered as a plugin.

## 📦 Installation

```bash
bun install @asterflow/fs
```

`fsRoutingPlugin` supports two mutually exclusive modes, picked automatically from which config key you pass:

**Dynamic** - point it at a directory, no codegen step required. Simplest for dev/unbundled runs (`bun run src/index.ts`), but the `import()` path is fully computed at runtime, so a bundler can't trace it - don't use this for a bundled/production build.

```ts
import { AsterFlow } from 'asterflow'
import { fsRoutingPlugin } from '@asterflow/fs'

const app = new AsterFlow()
  .use(fsRoutingPlugin, { path: './src/routes' })
```

**Static** - a pre-generated manifest of literal imports, safe for bundling. Generate it once (via `asterflow generate`, `--watch`, or `generateRouteManifest` in a build script) and pass the result in:

```ts
import { AsterFlow } from 'asterflow'
import { fsRoutingPlugin } from '@asterflow/fs'
import routes from './routes.gen'

const app = new AsterFlow()
  .use(fsRoutingPlugin, { routes })
```

Passing both `routes` and `path` is ambiguous - the plugin logs a warning and uses `path`.

### ✨ Features

- **Two loading modes, one plugin**: `path` scans and `import()`s the directory at `beforeInitialize` (via `loadRoutesFromDir`) - no manifest file needed. `routes` takes a pre-generated array instead, for when the app gets bundled.
- **Static manifest generation**: `generateRouteManifest` walks a routes directory once and writes a file with one literal `import` per route plus a default-exported array, so a bundler can follow it - unlike a fully-dynamic `import(path)`, which bundlers can't resolve at all.
- **File-to-URL conventions** (both modes): `index.ts` becomes `/`, `users/index.ts` becomes `/users`, and a `$`-prefixed segment like `$id.ts` becomes a `:id` param.
- **Auto path assignment**: any route whose `default export` has no explicit `path` gets one assigned from its file location.
- **Safe registration**: `fsRoutingPlugin` registers every resolved route with `instance.controller(route)` on `beforeInitialize`, and skips (with a warning) any entry that isn't a `Method`/`Router` instance instead of throwing.

## ❓ How to Use

For a static manifest, generate it ahead of time, usually via the `asterflow generate` CLI command, or by calling the generator directly from a build script:

```ts
import { generateRouteManifest } from '@asterflow/fs'

await generateRouteManifest({
  routesDir: './src/routes',
  outFile: './src/routes.gen.ts'
})
```

Route files just export a `Method` or `Router` - the `path` is filled in from the file's location (whichever mode you use), so `src/routes/users/$id.ts` becomes `/users/:id`:

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
