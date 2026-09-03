<div align="center">

# @asterflow/fs

![license-info](https://img.shields.io/github/license/AsterFlow/plugins?style=for-the-badge&colorA=302D41&colorB=f9e2af&logoColor=f9e2af)
![stars-info](https://img.shields.io/github/stars/AsterFlow/plugins?colorA=302D41&colorB=f9e2af&style=for-the-badge)
![bundle-size](https://img.shields.io/bundlejs/size/@asterflow/fs?style=for-the-badge&colorA=302D41&colorB=3ac97b)

</div>

> Roteamento baseado em convenções de sistema de arquivos para o AsterFlow.

## 📦 Installation

```bash
# You can use any package manager
npm install @asterflow/fs
```

## 💡 About

`@asterflow/fs` brings the convenience of file system-based routing to your AsterFlow projects. Inspired by modern web frameworks, this plugin automatically discovers and registers your routes based on the file and directory structure, allowing you to focus on writing your API logic instead of manual route configuration.

## ✨ Features

  - **Convention over Configuration:** Automatically generates API routes from your file structure.
  - **Dynamic Parameters:** Support for dynamic segments in filenames (e.g., `$id.ts`).
  - **Index Routes:** `index.ts` files are treated as the base route of a directory.
  - **Type-Safe:** Fully integrated with AsterFlow's type system.
  - **Seamless Integration:** Automatically registers all discovered routes before the server starts.

## 🚀 Usage

### 1\. Project Structure

Create a directory to store your route files. By convention, this directory is usually `routes/` or `src/routes/`.

```
.
├── routes/
│   ├── index.ts          # Handles GET /
│   ├── users/
│   │   ├── index.ts      # Handles GET /users
│   │   └── $id.ts        # Handles GET /users/:id
├── src
│   └── index.ts          # Your main application file
└── package.json
```

### 2\. Define Your Routes

Each route file must have a `default export` of an AsterFlow `Method` or `Router`.

**`src/routes/users/$id.ts`**

```typescript
import { Method } from '@asterflow/router';

export default new Method({
  // The 'path' property will be overwritten by the plugin,
  // but can be useful for isolated testing.
  path: '/',
  method: 'get',
  handler({ response, url }) {
    // 'id' will be available at runtime
    const params = url.getParams();
    return response.success({ user: { id: params.id } });
  }
});
```

### 3\. Register the Plugin

In your main application file, import and register the `fsRouting` plugin.

**`src/index.ts`**

```typescript
import { AsterFlow } from 'asterflow';
import { fsRouting } from '@asterflow/fs';
import { join } from 'path';

// Register the plugin and point it to your routes directory
export const app = new AsterFlow();
  .use(fsRouting, {
    path: join(process.cwd(), 'src', 'routes')
  });

// Start the server
app.listen({ port: 3333 }, () => {
  console.log('Server running with file system routing!');
});
```

That's it\! The plugin will scan the `src/routes` directory and register all valid route files when the application starts.

## 🗺️ Routing Conventions

The plugin transforms file paths into URL routes based on the following rules:

| File Path | Generated Route |
| ----------------- | ------------------ |
| `index.ts` | `/` |
| `users.ts` | `/users` |
| `users/index.ts` | `/users` |
| `$id.ts` | `/:id` |
| `products/$id.ts` | `/products/:id` |
| `categories/$categoryId/products/$productId.ts` | `/categories/:categoryId/products/:productId` |

  - Files named `index` become the root of their directory.
  - Filenames prefixed with `$` (e.g., `$id.ts`) are converted to dynamic URL parameters (e.g., `/:id`).

## 🔗 Related Packages

  - [asterflow](https://www.npmjs.com/package/asterflow) - The core of the AsterFlow framework.
  - [@asterflow/plugin](https://www.npmjs.com/package/@asterflow/plugin) - The main plugin system.
  - [@asterflow/router](https://www.npmjs.com/package/@asterflow/router) - The type-safe routing system used by this plugin.

## 📄 License

MIT - See the main project [LICENSE](https://github.com/AsterFlow/AsterFlow/blob/main/LICENSE) for more details.