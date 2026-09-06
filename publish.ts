import { existsSync } from 'fs'
import { readFile, writeFile } from 'fs/promises'
import { glob } from 'glob'
import { join } from 'path'
import { inc, type ReleaseType } from 'semver'
import { exec } from 'child_process'
import { promisify } from 'util'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

const execAsync = promisify(exec)

/**
 * See VERSIONING.md for what each part means in this repo. `'none'` skips the
 * increment entirely and publishes whatever version is already in
 * package.json - for a package's genuine first release (or a deliberate
 * manual renumbering) where there's no prior published version to bump from.
 */
type Bump = Extract<ReleaseType, 'major' | 'minor' | 'patch'> | 'none'

class Publisher {
  private readonly CLI = '\x1b[34mCLI\x1b[0m'
  private readonly VERSION = '\x1b[32mVERSION\x1b[0m'
  private readonly PUBLISH = '\x1b[35mPUBLISH\x1b[0m'

  constructor() {}

  private async updateVersion(pkgPath: string, bump: Bump): Promise<void> {
    if (bump === 'none') {
      const { name, version } = JSON.parse(await readFile(pkgPath, 'utf-8'))
      console.log(`${this.VERSION} Keeping ${name} at ${version} (--bump none)`)
      return
    }

    const content = await readFile(pkgPath, 'utf-8')
    const pkg = JSON.parse(content)

    const newVersion = inc(pkg.version, bump)
    if (!newVersion) {
      throw new Error(`Failed to increment version for ${pkgPath}`)
    }

    console.log(`${this.VERSION} Updating ${pkg.name} from ${pkg.version} to ${newVersion}`)
    pkg.version = newVersion

    await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
    console.log(`${this.VERSION} Updated ${pkgPath}`)
  }

  private async publishPackage(pkgPath: string): Promise<void> {
    try {
      const content = await readFile(join(pkgPath, 'package.json'), 'utf-8')
      const pkg = JSON.parse(content)
      
      console.log(`${this.PUBLISH} Publishing ${pkg.name}@${pkg.version}`)
      
      const packageName = pkgPath.split('/').filter(Boolean).pop() || ''
      const publishDir = join('publish', packageName)
      
      if (!existsSync(publishDir)) {
        throw new Error(`Publish directory not found: ${publishDir}. Did you run build?`)
      }
      
      console.log(`${this.PUBLISH} Running npm publish in: ${publishDir}`)

      // --provenance needs GitHub Actions' OIDC token (`id-token: write`) and fails outside a
      // supported CI environment, so it's opt-in based on where this is actually running.
      const provenance = process.env.GITHUB_ACTIONS === 'true' ? ' --provenance' : ''
      await execAsync(`npm publish --access public${provenance}`, {
        cwd: publishDir
      })
      
      console.log(`${this.PUBLISH} Successfully published ${pkg.name}@${pkg.version}`)
    } catch (error) {
      console.error(`${this.PUBLISH} Failed to publish ${pkgPath}:`, error)
      throw error
    }
  }

  public async publish(packageName?: string, bump: Bump = 'patch'): Promise<void> {
    try {
      let packages: string[]
      
      if (packageName) {
        // Match by folder basename (`fs`, `router`), full npm name (`@asterflow/fs`), or the
        // `core`/`asterflow` alias - not by re-deriving a path from the name, since a folder's
        // basename doesn't always equal its npm name (e.g. plugins/fs is `@asterflow/fs`).
        const all = await glob(['packages/*/', 'plugins/*/', 'core'])
        const folderName = packageName.includes('/') ? packageName.split('/').pop() : packageName

        let matched: string | undefined
        for (const cand of all) {
          if (cand.split('/').pop() === packageName || cand.split('/').pop() === folderName) {
            matched = cand
            break
          }
          try {
            const pkg = JSON.parse(await readFile(join(cand, 'package.json'), 'utf-8'))
            if (pkg.name === packageName) {
              matched = cand
              break
            }
          } catch {}
        }
        if (!matched && (packageName === 'core' || packageName === 'asterflow')) {
          matched = 'core'
        }

        if (!matched) {
          console.error(`\x1b[31mError:\x1b[0m Package '${packageName}' not found`)
          console.error(`Available: ${all.join(', ')}`)
          process.exit(1)
        }

        packages = [matched]
        console.log(`${this.CLI} Publishing single package: \x1b[36m${packageName}\x1b[0m -> ${matched}`)
      } else {
        packages = await glob(['packages/*/', 'plugins/*/', 'core'])
        console.log(`${this.CLI} Publishing all packages.`)
      }
      
      console.log(`${this.CLI} Found packages:`, packages)

      for (const pkg of packages) {
        await this.updateVersion(join(pkg, 'package.json'), bump)
      }

      console.log(`${this.CLI} Running build...`)
      if (packageName) {
        const folderName = packageName.includes('/') ? packageName.split('/').pop() : packageName
        // Pass folder name to build for correct filtering
        await execAsync(`bun run build --package ${folderName}`)
      } else {
        await execAsync('bun run build')
      }
      console.log(`${this.CLI} Build completed`)

      for (const pkg of packages) {
        await this.publishPackage(pkg)
      }

      console.log(`${this.CLI} All packages have been published successfully!`)
    } catch (error) {
      console.error(`${this.CLI} Failed to publish packages:`, error)
      process.exit(1)
    }
  }
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .options({
      package: {
        alias: 'p',
        type: 'string',
        describe: 'Package folder or npm name to publish (e.g., fs, @asterflow/fs, adapter)',
        demandOption: false
      },
      bump: {
        alias: 'b',
        type: 'string',
        choices: ['major', 'minor', 'patch', 'none'] as const,
        default: 'patch' as const,
        describe: 'Version part to increment - see VERSIONING.md for what each means in this repo'
      }
    })
    .help()
    .alias('help', 'h')
    .parse()

  const publisher = new Publisher()
  await publisher.publish(argv.package as string | undefined, argv.bump)
}

main().catch((error) => {
  console.error('Error during publish:', error)
  process.exit(1)
})
