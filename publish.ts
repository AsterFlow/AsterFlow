import { existsSync } from 'fs'
import { readFile, writeFile } from 'fs/promises'
import { glob } from 'glob'
import { join } from 'path'
import { inc } from 'semver'
import { exec } from 'child_process'
import { promisify } from 'util'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

const execAsync = promisify(exec)

class Publisher {
  private readonly CLI = '\x1b[34mCLI\x1b[0m'
  private readonly VERSION = '\x1b[32mVERSION\x1b[0m'
  private readonly PUBLISH = '\x1b[35mPUBLISH\x1b[0m'

  constructor() {}

  private async updateVersion(pkgPath: string): Promise<void> {
    const content = await readFile(pkgPath, 'utf-8')
    const pkg = JSON.parse(content)
    
    const newVersion = inc(pkg.version, 'patch')
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
      
      await execAsync('npm publish --access public', {
        cwd: publishDir
      })
      
      console.log(`${this.PUBLISH} Successfully published ${pkg.name}@${pkg.version}`)
    } catch (error) {
      console.error(`${this.PUBLISH} Failed to publish ${pkgPath}:`, error)
      throw error
    }
  }

  public async publish(packageName?: string): Promise<void> {
    try {
      let packages: string[]
      
      if (packageName) {
        // Check both core and packages/* / plugins/* for the requested name
        const candidates = [
          `packages/${packageName}/`,
          `plugins/${packageName}/`,
          `core/`, // allow "core" or "asterflow"
        ]
        // Also handle npm names like @asterflow/fs -> folder fs
        const folderName = packageName.includes('/') ? packageName.split('/').pop() : packageName
        if (folderName && folderName !== packageName) {
          candidates.unshift(`plugins/${folderName}/`, `packages/${folderName}/`)
        }

        let matched: string | undefined
        for (const cand of candidates) {
          if (existsSync(join(cand, 'package.json'))) {
            // Verify name matches if possible, but accept folder match
            if (cand === `packages/${packageName}/` || cand === `packages/${folderName}/` || packageName === 'core' || packageName === 'asterflow') {
              matched = cand
              break
            }
            // Fallback check by reading name
            try {
              const content = await readFile(join(cand, 'package.json'), 'utf-8')
              const pkg = JSON.parse(content)
              if (pkg.name === packageName) {
                matched = cand
                break
              }
            } catch {}
          }
        }

        if (!matched) {
          // Try glob fallback for exact folder
          const all = await glob(['packages/*/', 'plugins/*/', 'core'])
          const found = all.find(p => p.includes(`/${folderName}/`) || p.includes(`/${packageName}/`) || p === `${packageName}/`)
          if (found) matched = found
        }

        if (!matched || !existsSync(matched)) {
          console.error(`\x1b[31mError:\x1b[0m Package '${packageName}' not found`)
          const all = await glob(['packages/*/', 'plugins/*/', 'core'])
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
        await this.updateVersion(join(pkg, 'package.json'))
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
      }
    })
    .help()
    .alias('help', 'h')
    .parse()

  const publisher = new Publisher()
  await publisher.publish(argv.package as string | undefined)
}

main().catch((error) => {
  console.error('Error during publish:', error)
  process.exit(1)
})
