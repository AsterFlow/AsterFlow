import type { AdapterDefinition } from '../registry/adapters'
import type { PluginDefinition } from '../registry/plugins'

export interface PackageJsonOptions {
  name: string
  adapter: AdapterDefinition
  plugins: PluginDefinition[]
}

export function generatePackageJson({ name, adapter, plugins }: PackageJsonOptions): string {
  const dependencies: Record<string, string> = {
    asterflow: '^0.0.5',
    '@asterflow/adapter': '^1.0.0',
    zod: '^3.25.67'
  }

  if (adapter.dependency) dependencies[adapter.dependency] = 'latest'
  for (const plugin of plugins) dependencies[plugin.packageName] = plugin.version

  const sorted = Object.fromEntries(Object.entries(dependencies).sort(([a], [b]) => a.localeCompare(b)))

  const pkg = {
    name,
    version: '0.1.0',
    type: 'module',
    private: true,
    scripts: {
      dev: 'bun run index.ts'
    },
    dependencies: sorted,
    devDependencies: {
      typescript: '^5.8.3',
      '@types/bun': 'latest'
    }
  }

  return `${JSON.stringify(pkg, null, 2)}\n`
}
