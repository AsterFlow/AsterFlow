import { resolveAsterflowVersion, resolveLatestVersion } from '../helpers/npmVersion'
import type { AdapterDefinition } from '../registry/adapters'
import type { PluginDefinition } from '../registry/plugins'

export interface PackageJsonOptions {
  name: string
  adapter: AdapterDefinition
  plugins: PluginDefinition[]
}

export async function generatePackage({ name, adapter, plugins }: PackageJsonOptions): Promise<string> {
  const usesFs = plugins.some((plugin) => plugin.id === 'fs')

  const [asterflowVersion, adapterVersion, cliVersion, routerVersion, tsdownVersion, pluginVersions] = await Promise.all([
    resolveAsterflowVersion('asterflow'),
    resolveAsterflowVersion('@asterflow/adapter'),
    usesFs ? resolveAsterflowVersion('@asterflow/cli') : Promise.resolve(null),
    // Route files (both templates) `import { Method } from '@asterflow/router'` directly -
    // without listing it, tsdown/rolldown sees an undeclared dependency and inlines its own
    // copy instead of treating it as external, which duplicates the `Method` class and
    // breaks plugins (e.g. `@asterflow/multipart`) that patch the real module's prototype.
    usesFs ? resolveAsterflowVersion('@asterflow/router') : Promise.resolve(null),
    // tsdown isn't part of the AsterFlow lockstep versioning - just take whatever's latest.
    resolveLatestVersion('tsdown', '0.23.0'),
    Promise.all(plugins.map((plugin) => resolveAsterflowVersion(plugin.packageName)))
  ])

  const dependencies: Record<string, string> = {
    asterflow: asterflowVersion,
    '@asterflow/adapter': adapterVersion,
    zod: '^3.25.67'
  }

  if (adapter.dependency) dependencies[adapter.dependency] = 'latest'
  if (usesFs && routerVersion) dependencies['@asterflow/router'] = routerVersion
  plugins.forEach((plugin, index) => { dependencies[plugin.packageName] = pluginVersions[index]! })

  const sorted = Object.fromEntries(Object.entries(dependencies).sort(([a], [b]) => a.localeCompare(b)))

  const scripts: Record<string, string> = {
    ...(usesFs
      ? { predev: 'asterflow generate', dev: 'bun run src/index.ts', prebuild: 'asterflow generate' }
      : { dev: 'bun run src/index.ts' }),
    build: 'tsdown',
    start: `${adapter.runCommand} dist/index.mjs`
  }

  const devDependencies: Record<string, string> = {
    typescript: '^5.8.3',
    '@types/bun': 'latest',
    '@types/node': 'latest',
    tsdown: tsdownVersion
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
