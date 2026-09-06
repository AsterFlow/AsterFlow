import { resolveAsterflowVersion } from '../helpers/npmVersion'
import type { AdapterDefinition } from '../registry/adapters'
import type { PluginDefinition } from '../registry/plugins'

export interface PackageJsonOptions {
  name: string
  adapter: AdapterDefinition
  plugins: PluginDefinition[]
}

export async function generatePackage({ name, adapter, plugins }: PackageJsonOptions): Promise<string> {
  const usesFs = plugins.some((plugin) => plugin.id === 'fs')

  const [asterflowVersion, adapterVersion, cliVersion, pluginVersions] = await Promise.all([
    resolveAsterflowVersion('asterflow'),
    resolveAsterflowVersion('@asterflow/adapter'),
    usesFs ? resolveAsterflowVersion('@asterflow/cli') : Promise.resolve(null),
    Promise.all(plugins.map((plugin) => resolveAsterflowVersion(plugin.packageName)))
  ])

  const dependencies: Record<string, string> = {
    asterflow: asterflowVersion,
    '@asterflow/adapter': adapterVersion,
    zod: '^3.25.67'
  }

  if (adapter.dependency) dependencies[adapter.dependency] = 'latest'
  plugins.forEach((plugin, index) => { dependencies[plugin.packageName] = pluginVersions[index]! })

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
  if (usesFs && cliVersion) devDependencies['@asterflow/cli'] = cliVersion

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
