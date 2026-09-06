export interface RouteTemplate {
  id: string
  path: string
  source: string
  plugin?: string
  summary: string
}

export const TEMPLATE_REGISTRY: Record<string, RouteTemplate> = {
  hello: {
    id: 'hello',
    path: '/',
    source: 'routes/index.ts',
    summary: 'Minimal GET route at the root path.'
  },
  upload: {
    id: 'upload',
    path: '/upload',
    source: 'routes/upload.ts',
    plugin: 'multipart',
    summary: 'File upload handled by @asterflow/multipart.'
  }
}

export const TEMPLATE_IDS = Object.keys(TEMPLATE_REGISTRY)

export function availableTemplates(pluginIds: string[]): RouteTemplate[] {
  const active = new Set(pluginIds)
  return TEMPLATE_IDS
    .map((id) => TEMPLATE_REGISTRY[id]!)
    .filter((template) => !template.plugin || active.has(template.plugin))
}

export function templateTarget(template: RouteTemplate): string {
  const trimmed = template.path.replace(/^\/+|\/+$/g, '')
  return trimmed.length === 0 ? 'index.ts' : `${trimmed}/index.ts`
}
