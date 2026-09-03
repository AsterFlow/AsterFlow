import { readFile } from 'fs/promises'
import { glob } from 'glob'
import { join } from 'path'

const CLI = '\x1b[34mCLI\x1b[0m'

interface CheckResult {
  pkgPath: string
  name: string
  issues: string[]
}

async function checkWorkspaces(): Promise<void> {
  console.log(`${CLI} Checking workspace: protocol compliance...`)

  const packagePaths = await glob(['packages/*/', 'plugins/*/', 'core', 'example', 'benchmark'])
  const results: CheckResult[] = []

  for (const pkgPath of packagePaths) {
    const pkgJsonPath = join(pkgPath, 'package.json')
    let content: string
    try {
      content = await readFile(pkgJsonPath, 'utf-8')
    } catch {
      continue
    }

    const pkg = JSON.parse(content)
    const issues: string[] = []

    // Collect all deps
    for (const field of ['dependencies', 'devDependencies', 'peerDependencies'] as const) {
      const deps = pkg[field] as Record<string, string> | undefined
      if (!deps) continue
      for (const [depName, depVersion] of Object.entries(deps)) {
        if (depName.startsWith('@asterflow/') || depName === 'asterflow') {
          // Internal packages should use workspace:
          if (typeof depVersion === 'string' && !depVersion.startsWith('workspace:')) {
            // Allow url-parser which is external npm package
            if (depName === '@asterflow/url-parser') continue
            issues.push(`${field}.${depName}: "${depVersion}" should be "workspace:<relative path>"`)
          }
          // Check relative path format: should be workspace:../ or workspace:../../
          if (typeof depVersion === 'string' && depVersion.startsWith('workspace:') && !depVersion.startsWith('workspace:../') && !depVersion.startsWith('workspace:../../')) {
            issues.push(`${field}.${depName}: "${depVersion}" unexpected workspace path (expected ../ relative)`)
          }
        } else if (typeof depVersion === 'string' && depVersion.startsWith('workspace:')) {
          issues.push(`${field}.${depName}: external package "${depName}" should not use workspace:`)
        }
      }
    }

    if (issues.length > 0) {
      results.push({ pkgPath, name: pkg.name, issues })
    } else {
      console.log(`${CLI} ✅ ${pkg.name} (${pkgPath}) OK`)
    }
  }

  if (results.length > 0) {
    console.error(`\n\x1b[31m${CLI} Found workspace protocol issues:\x1b[0m`)
    for (const r of results) {
      console.error(`\n  \x1b[33m${r.name} (${r.pkgPath}):\x1b[0m`)
      for (const issue of r.issues) {
        console.error(`    - ${issue}`)
      }
    }
    console.error(`\n\x1b[31mFix: use workspace:<relative path> e.g. "workspace:../router" or "workspace:../../core"\x1b[0m`)
    process.exit(1)
  } else {
    console.log(`\n${CLI} ✅ All workspaces use correct workspace: protocol`)
  }

  // Also check that no publish dir still contains workspace: (if publish exists)
  const publishPkgs = await glob('publish/*/package.json')
  let leaked = false
  for (const pubPath of publishPkgs) {
    const content = await readFile(pubPath, 'utf-8')
    if (content.includes('workspace:')) {
      console.error(`\x1b[31mPublish leak:\x1b[0m ${pubPath} still contains workspace:`)
      leaked = true
    }
  }
  if (leaked) {
    console.error(`\x1b[31mBuild output still contains workspace: - run build to fix\x1b[0m`)
    process.exit(1)
  } else if (publishPkgs.length > 0) {
    console.log(`${CLI} ✅ No workspace: leaks in publish/ (${publishPkgs.length} packages)`)
  }
}

checkWorkspaces().catch((err) => {
  console.error(err)
  process.exit(1)
})
