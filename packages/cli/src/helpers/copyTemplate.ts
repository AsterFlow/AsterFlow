import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

// `__dirname`, not `import.meta.url` - the published `bin` entry is the CJS
// build (`dist/cjs/index.cjs`), and esbuild's cjs output empties out
// `import.meta.url` entirely (it has no meaningful equivalent there), while
// `__dirname` is a real CJS global. Bun also provides `__dirname` when
// running the ESM-syntax source directly in dev (`bun run src/index.ts`).
//
// This file always lives two path segments below the package root, in both
// layouts that ever run it: `src/helpers/` in dev, and `dist/cjs/` once
// esbuild bundles everything in this package into one file for publishing
// (see `build.ts`'s `copyAssets`, which ships `templates/` a level above
// `dist/`). `../../templates` resolves correctly in both - don't move this
// file without re-checking that.
const TEMPLATES_DIR = join(__dirname, '..', '..', 'templates')

/** Reads a static file from `packages/cli/templates/<name>`, verbatim. */
export async function readTemplate(name: string): Promise<string> {
  return readFile(join(TEMPLATES_DIR, name), 'utf-8')
}

/** Copies a static file from `packages/cli/templates/<name>` to `destPath`, verbatim. */
export async function copyTemplate(name: string, destPath: string): Promise<void> {
  const contents = await readTemplate(name)
  await writeFile(destPath, contents)
}
