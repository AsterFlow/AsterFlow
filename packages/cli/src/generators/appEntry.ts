import type { AdapterDefinition } from '../registry/adapters'
import type { PluginDefinition } from '../registry/plugins'

export interface AppEntryOptions {
  adapter: AdapterDefinition
  plugins: PluginDefinition[]
  stub: boolean
}

export function generateEntry({ adapter, plugins, stub }: AppEntryOptions): string {
  const usesFs = plugins.some((plugin) => plugin.id === 'fs')

  const imports = [
    'import { AsterFlow } from \'asterflow\'',
    'import { adapters } from \'@asterflow/adapter\'',
    ...adapter.imports,
    ...plugins.map((plugin) => `import { ${plugin.importName} } from '${plugin.packageName}'`),
    // Imported last, deliberately: plugins like @asterflow/multipart patch
    // `Method`/`RouteMethodBuilder`'s prototype with chain methods (e.g.
    // `.multipart(...)`) as a side effect of being imported. Route files
    // pulled in transitively by `./routes.gen` call those chain methods at
    // module-evaluation time, so the plugin imports above must run first.
    ...(usesFs ? ['import routes from \'./routes.gen\''] : [])
  ]

  const chain = [
    ...plugins.map((plugin) => plugin.useSnippet.replace(/^\./, '')),
    ...(!usesFs && stub ? [`method({
    path: '/',
    method: 'get',
    handler({ response }) {
      return response.success({ message: 'Hello from AsterFlow!' })
    }
  })`] : []),
    `listen${adapter.listenCall}`
  ]

  const preamble = adapter.preamble ? `${adapter.preamble}\n\n` : ''

  return `${imports.join('\n')}

${preamble}export default new AsterFlow({ driver: ${adapter.driverExpression} })
  .${chain.join('\n  .')}
`
}
