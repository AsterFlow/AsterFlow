import { readTemplate } from '../helpers/copyTemplate'
import { availableTemplates, templateTarget } from '../registry/templates'

export interface RoutesOptions {
  pluginIds: string[]
  templateIds: string[]
}

export interface RouteFile {
  fileName: string
  content: string
}

export async function generateRoutes({ pluginIds, templateIds }: RoutesOptions): Promise<RouteFile[]> {
  if (!pluginIds.includes('fs')) return []

  const selected = availableTemplates(pluginIds).filter((template) => templateIds.includes(template.id))

  return Promise.all(selected.map(async (template) => ({
    fileName: templateTarget(template),
    content: await readTemplate(template.source)
  })))
}
