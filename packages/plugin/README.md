<div align="center">

# @asterflow/plugin

![license-info](https://img.shields.io/github/license/AsterFlow/AsterFlow?style=for-the-badge&colorA=302D41&colorB=f9e2af&logoColor=f9e2af)
![stars-info](https://img.shields.io/github/stars/AsterFlow/AsterFlow?colorA=302D41&colorB=f9e2af&style=for-the-badge)
![last-commit](https://img.shields.io/github/last-commit/AsterFlow/AsterFlow?path=packages%2Fresponse&style=for-the-badge&colorA=302D41&colorB=b4befe)

![bundle-size](https://img.shields.io/bundlejs/size/@asterflow/plugin?style=for-the-badge&colorA=302D41&colorB=3ac97b)

</div>

> A modular and typed plugin system for extending AsterFlow functionality.

## 📦 Installation

```bash
npm install @asterflow/plugin
# or
bun install @asterflow/plugin
```

## 💡 About

`@asterflow/plugin` provides a robust and typed system for extending AsterFlow's functionality. It allows developers to create modular plugins that can inject context, manipulate configurations, and react to application lifecycle events, ensuring seamless and type-safe integration.

## ✨ Features

-   **Extensible Plugin System:** Create modular plugins to add custom functionalities to AsterFlow.
-   **Dynamic Context:** Inject static values into the plugin's context (`decorate`) or derive complex properties based on configuration and existing context (`derive`).
-   **Lifecycle Hooks:** Register handlers for specific AsterFlow application events (such as `beforeInitialize`, `afterInitialize`, `onRequest`, and `onResponse`) to extend behavior at different stages.
-   **Typed Configuration:** Define the plugin's configuration structure and its default values, with automatic type inference.
-   **Type Safety:** Full TypeScript support to ensure your plugin's context, configuration, and hooks are type-safe.
-   **Runtime Optimization:** Hooks are efficiently invoked only when the plugin is registered, allowing for performance optimizations.

## 🚀 Usage

`@asterflow/plugin` enables the creation of plugins that extend `AsterFlow` in a modular and type-safe manner. Below are examples of how to create and use plugins.

### Creating a Basic Plugin

```typescript
import { Plugin } from '@asterflow/plugin'

const myPlugin = Plugin.create({ name: 'my-first-plugin' })
  .decorate('appName', 'My AsterFlow Application') // Adds a static value to the plugin's context
  .on('beforeInitialize', (app, context) => {
    console.log(`Initializing ${context.appName}...`)
    // app is the AsterFlow instance
  })
  .on('afterInitialize', (app, context) => {
    console.log(`${context.appName} has been initialized!`)
  })

// This plugin can now be registered with `app.use(myPlugin)`
```

### Using Configuration and Derivation

Plugins can be configured and can derive values based on their configuration or existing context.

```typescript
import { Plugin } from '@asterflow/plugin'

interface FeaturePluginConfig {
  featureEnabled: boolean;
  featureName: string;
}

const featureTogglePlugin = Plugin.create({ name: 'feature-toggle' })
  .withConfig<FeaturePluginConfig>({
    featureEnabled: true,
    featureName: 'Awesome Feature'
  })
  .derive('statusMessage', (context) => {
    return context.featureEnabled
      ? `${context.featureName} is enabled.`
      : `${context.featureName} is disabled.`
  })
  .on('beforeInitialize', (app, context) => {
    console.log(context.statusMessage) // "Awesome Feature is enabled."
  })

// This plugin can be configured when registered:
// app.use(featureTogglePlugin, { featureEnabled: false })
```

### Lifecycle Hooks

Hooks allow plugins to react to important events in the `AsterFlow` lifecycle.

```typescript
import { Plugin } from '@asterflow/plugin'
import { Request } from '@asterflow/request'
import { Response } from '@asterflow/response'

const loggerPlugin = Plugin.create({ name: 'logger-plugin' })
  .on('onRequest', (request, response, context) => {
    // Logs request details
    console.log(`[REQ] ${request.getMethod()} ${request.getPathname()}`)
  })
  .on('onResponse', (request, response, context) => {
    // Logs response details
    console.log(`[RES] ${response.getStatus()} ${request.getPathname()}`)
  })

// Register this plugin for global logging
// app.use(loggerPlugin)
```

### Integrating with AsterFlow

To use the created plugins, you register them with the `AsterFlow` instance.

```typescript
import { AsterFlow } from '@asterflow/core'
import { adapters } from '@asterflow/adapter'
import fastify from 'fastify'
// Import your plugins here
// import { myPlugin, featureTogglePlugin, loggerPlugin } from './your-plugins'

const server = fastify()
const app = new AsterFlow({
  driver: adapters.fastify
})

// Example plugin registration
app.use(myPlugin) // No additional configuration
app.use(featureTogglePlugin, { featureEnabled: false }) // With overridden configuration
app.use(loggerPlugin)

app.listen(server, { port: 3000 }, (err) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log('AsterFlow server with plugins listening on port 3000!')
})
```

## 🔗 Related Packages

-   [@asterflow/core](https://www.npmjs.com/package/@asterflow/core) - The heart of the AsterFlow framework.
-   [@asterflow/adapter](https://www.npmjs.com/package/@asterflow/adapter) - HTTP adapters for different runtimes.
-   [@asterflow/router](https://www.npmjs.com/package/@asterflow/router) - Type-safe routing system.
-   [@asterflow/request](https://www.npmjs.com/package/@asterflow/request) - Unified HTTP request system.
-   [@asterflow/response](https://www.npmjs.com/package/@asterflow/response) - Type-safe HTTP response system.

## 📄 License

MIT - See [LICENSE](https://github.com/AsterFlow/AsterFlow/blob/main/LICENSE) for more details.
