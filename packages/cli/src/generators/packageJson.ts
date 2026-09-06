import type { AdapterDefinition } from '../registry/adapters'
import type { PluginDefinition } from '../registry/plugins'

export interface PackageJsonOptions {
  name: string
  adapter: AdapterDefinition
  plugins: PluginDefinition[]
}

export function generatePackage({ name, adapter, plugins }: PackageJsonOptions): string {
  const usesFs = plugins.some((plugin) => plugin.id === 'fs')

  const dependencies: Record<string, string> = {
    asterflow: '^0.0.5',
    '@asterflow/adapter': '^1.0.0',
    zod: '^3.25.67'
  }

  if (adapter.dependency) dependencies[adapter.dependency] = 'latest'
  for (const plugin of plugins) dependencies[plugin.packageName] = plugin.version

  const sorted = Object.fromEntries(Object.entries(dependencies).sort(([a], [b]) => a.localeCompare(b)))

  const scripts: Record<string, string> = usesFs
    ? {
      predev: 'asterflow generate',
      dev: 'bun run src/index.ts',
      prebuild: 'asterflow generate'
    }
    : { dev: 'bun run src/index.ts' }

  const devDependencies: Record<string, string> = {
    typescript: '^5.8.3',
    '@types/bun': 'latest'
  }
  if (usesFs) devDependencies['@asterflow/cli'] = '^0.1.0'

  const pkg = {
    name,
    version: '0.1.0',
    type: 'module',
    private: true,
    scripts,
    dependencies: sorted,
    devDependencies
  }

  return `${JSON.stringify(pkg, null, 2)}\n`
}
