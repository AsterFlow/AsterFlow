import type { AdapterDefinition } from '../registry/adapters'
import type { PluginDefinition } from '../registry/plugins'

export interface AppEntryOptions {
  adapter: AdapterDefinition
  plugins: PluginDefinition[]
  exampleRoutes: boolean
}

export function generateAppEntry({ adapter, plugins, exampleRoutes }: AppEntryOptions): string {
  const usesFs = plugins.some((plugin) => plugin.id === 'fs')

  const imports = [
    `import { AsterFlow } from 'asterflow'`,
    `import { adapters } from '@asterflow/adapter'`,
    ...(usesFs && exampleRoutes ? [`import { join } from 'path'`] : []),
    ...adapter.imports,
    ...plugins.map((plugin) => `import { ${plugin.importName} } from '${plugin.packageName}'`)
  ]

  const useChain = plugins.length > 0
    ? `\n  ${plugins.map((plugin) => plugin.useSnippet).join('\n  ')}`
    : ''

  const staticRoute = !usesFs && exampleRoutes
    ? `\napp.method({
  path: '/',
  method: 'get',
  handler({ response }) {
    return response.success({ message: 'Hello from AsterFlow!' })
  }
})\n`
    : ''

  return `${imports.join('\n')}

const app = new AsterFlow({ driver: ${adapter.driverExpression} })${useChain}
${staticRoute}
${adapter.listenSnippet}
`
}
