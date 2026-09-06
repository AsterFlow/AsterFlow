<div align="center">

# @asterflow/plugin

![license-info](https://img.shields.io/github/license/AsterFlow/AsterFlow?style=for-the-badge&colorA=302D41&colorB=f9e2af&logoColor=f9e2af)
![stars-info](https://img.shields.io/github/stars/AsterFlow/AsterFlow?colorA=302D41&colorB=f9e2af&style=for-the-badge)
![last-commit](https://img.shields.io/github/last-commit/AsterFlow/AsterFlow?path=packages%2Fplugin&style=for-the-badge&colorA=302D41&colorB=b4befe)

![bundle-size](https://img.shields.io/bundlejs/size/@asterflow/plugin?style=for-the-badge&colorA=302D41&colorB=3ac97b)

</div>

> The plugin-authoring system used to build AsterFlow plugins - a typed builder for context, config and lifecycle hooks.

## 📦 Installation

```bash
bun install @asterflow/plugin
```

### ✨ Features

- **Fluent builder:** chain `.config()`, `.decorate()`, `.derive()`, `.extends()` and `.on()` off a single `Plugin.create({ name })` call.
- **Typed config with defaults:** `.config()` sets the plugin's default config and infers its shape.
- **Static and derived context:** `.decorate()` injects a fixed value; `.derive()` computes a value from the config and context already built, lazily, when the plugin is registered.
- **Instance extensions:** `.extends()` adds new properties/methods to the AsterFlow instance, computed from the app and the plugin's context.
- **Lifecycle hooks:** `.on()` registers handlers for `beforeInitialize`, `afterInitialize`, `onRequest` and `onResponse`.
- **Type inference end-to-end:** every chained call narrows a single `Props` type, so config, context and extensions stay typed without manual generics.

## ❓ How to Use

Build a plugin with `Plugin.create`, then chain the pieces it needs. This one adds a config option and exposes a method on the AsterFlow instance:

```ts
import { Plugin } from '@asterflow/plugin'

export const fsRoutingPlugin = Plugin.create({ name: 'fs-routing' })
  .config({ routes: [] as unknown[] })
  .extends((instance, context) => ({
    registerRoutes() {
      for (const route of context.routes) instance.controller(route)
    }
  }))
  .on('beforeInitialize', (instance, context) => instance.registerRoutes())
```

`.decorate()` and `.derive()` build up the plugin's context the same way - `decorate` for a static value, `derive` for one computed from config/context:

```ts
const withGreeting = Plugin.create({ name: 'greeting' })
  .decorate('appName', 'My App')
  .derive('greeting', (context) => `Hello, ${context.appName}!`)
  .on('afterInitialize', (_app, context) => console.log(context.greeting))
```

The finished plugin is registered on an app with `app.use(fsRoutingPlugin, { routes: [...] })`.

## 🔗 Related Packages

- Depended on by [asterflow](https://www.npmjs.com/package/asterflow) - the core framework consumes plugin instances and their types to power `app.use()`.
- Depended on by [@asterflow/multipart](https://www.npmjs.com/package/@asterflow/multipart) - built as a plugin with `Plugin.create()`.
- Depended on by `@asterflow/fs` - built as a plugin with `Plugin.create()`.

## 📄 License

This project is licensed under the [MIT License](../../LICENSE).
