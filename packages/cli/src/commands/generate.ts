import { generateRouteManifest } from '@asterflow/fs'
import { watch } from 'fs'
import { join, resolve } from 'path'
import { log } from '../utils/log'

export interface GenerateOptions {
  directory?: string
  out?: string
  watch?: boolean
}

const DEFAULT_ROUTES_DIR = 'src/routes'
const DEFAULT_OUT_FILE = 'src/routes.gen.ts'

export async function runGenerate({ directory, out, watch: watchMode }: GenerateOptions): Promise<void> {
  const routesDir = resolve(directory ?? DEFAULT_ROUTES_DIR)
  const outFile = resolve(out ?? DEFAULT_OUT_FILE)

  const run = async (): Promise<void> => {
    try {
      await generateRouteManifest({ routesDir, outFile })
      log.success(`Generated ${join(out ?? DEFAULT_OUT_FILE)}`)
    } catch (error) {
      log.error(error instanceof Error ? error.message : String(error))
      if (!watchMode) process.exitCode = 1
    }
  }

  await run()

  if (!watchMode) return

  log.info(`Watching ${routesDir} for changes...`)

  let pending: ReturnType<typeof setTimeout> | undefined
  watch(routesDir, { recursive: true }, () => {
    clearTimeout(pending)
    pending = setTimeout(run, 100)
  })
}
