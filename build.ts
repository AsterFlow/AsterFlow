import { generateDtsBundle } from 'dts-bundle-generator'
import { existsSync } from 'fs'
import { cp, mkdir, readFile, rm, writeFile } from 'fs/promises'
import { glob } from 'glob'
import { dirname, join, resolve } from 'path'
import { build, type Options } from 'tsup'

const blue = (text: string) => `\x1b[34m${text}\x1b[0m`
const green = (text: string) => `\x1b[32m${text}\x1b[0m`

const CLI = blue('CLI')
const ESM = green('ESM')

console.log(`${CLI} Cleaning up old publish directory...`)
if (existsSync('publish')) await rm('publish', { recursive: true })
console.log(`${CLI} Cleaned publish directory`)

const assets = ['README.md', 'tsconfig.json', 'package.json']
const sharedConfig: Options = {
  platform: 'node',
  bundle: true,
  minify: true,
  minifyIdentifiers: true,
  minifySyntax: true,
  minifyWhitespace: true,
  skipNodeModulesBundle: true,
  clean: true,
  dts: false
}

async function readPkgJson(pkgPath: string) {
  console.log(`${CLI} Reading package.json at ${pkgPath}`)
  const content = await readFile(pkgPath, 'utf-8')
  const pkg = JSON.parse(content) as { name: string; version: string; [k: string]: any }
  console.log(`${CLI} Parsed package ${pkg.name}@${pkg.version}`)
  return pkg
}

async function replaceWorkspaceDeps(publishDir: string) {
  console.log(`${CLI} Replacing workspace deps in ${publishDir}`)
  const manifestPath = join(publishDir, 'package.json')
  const pkg = await readPkgJson(manifestPath)

  for (const field of ['dependencies', 'devDependencies', 'peerDependencies'] as const) {
    const deps = pkg[field] as Record<string, string>
    if (!deps) continue

    const toAdd: Record<string, string> = {}

    for (const [depName, depVersion] of Object.entries(deps)) {
      if (typeof depVersion === 'string' && depVersion.startsWith('workspace:')) {
        console.log(`${CLI} Found workspace dependency ${depName}: ${depVersion}`)
        const relPath = depVersion.replace(/^workspace:/, '').replace('packages/', '')
        const targetDir = resolve(publishDir, relPath)
        const targetPkg = await readPkgJson(join(targetDir, 'package.json'))

        console.log(`${CLI} Replacing ${depName}@${depVersion} with ${targetPkg.version}`)
        toAdd[targetPkg.name] = targetPkg.version
      }
    }

    for (const [name, version] of Object.entries(toAdd)) {
      deps[name] = version
    }
  }

  await writeFile(manifestPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
  console.log(`${CLI} Updated workspace deps in ${publishDir}`)
}

async function buildPackage(name: string, path: string) {
  console.log(`${CLI} Building package: ${name}`)

  console.log(`${CLI} Building entry: ${path}/src/index.ts`)
  console.log(`${CLI} Using tsconfig: tsconfig.cjs.json`)
  await build({
    format: 'cjs',
    outDir: `publish/${name}/dist/cjs`,
    tsconfig: './tsconfig.cjs.json',
    splitting: false,
    shims: true,
    entry: [`${path}/src/index.ts`],
    ...sharedConfig
  })
  console.log(`${CLI} Built CJS for ${name}`)

  console.log(`${CLI} Building entry: ${path}/src/index.ts`)
  console.log(`${CLI} Using tsconfig: tsconfig.mjs.json`)
  console.log(`${ESM} Build start`)
  await build({
    format: 'esm',
    outDir: `publish/${name}/dist/mjs`,
    tsconfig: './tsconfig.mjs.json',
    splitting: true,
    cjsInterop: false,
    entry: [`${path}/src/index.ts`],
    ...sharedConfig
  })
  console.log(`${ESM} publish/${name}/dist/mjs/index.js`)
  console.log(`${CLI} Built ESM for ${name}`)

  console.log(`${CLI} Writing type definition package.json files for ${name}`)
  await writeFile(`publish/${name}/dist/cjs/package.json`, JSON.stringify({ type: 'commonjs' }, null, 2))
  await writeFile(`publish/${name}/dist/mjs/package.json`, JSON.stringify({ type: 'module' }, null, 2))

  for (const asset of assets) {
    console.log(`${CLI} Copying asset: ${asset}`)
    await cp(join(path, asset), `publish/${name}/${asset}`)
  }

  const dtsPath = join(process.cwd(), `publish/${name}/dist/types/index.ts`)
  console.log(`${CLI} Generating .d.ts bundle at ${dtsPath}`)
  const dtsCode = generateDtsBundle([{
    filePath: join(process.cwd(), `${path}/src/index.ts`),
    output: {
      sortNodes: true,
      exportReferencedTypes: true,
      inlineDeclareExternals: true,
      inlineDeclareGlobals: true
    } }], {
    preferredConfigPath: `${path}/tsconfig.json`
  })

  await mkdir(dirname(dtsPath), { recursive: true })
  await writeFile(dtsPath, dtsCode, { encoding: 'utf-8' })
  console.log(`${CLI} .d.ts bundle generated for ${name}`)
  console.log(`${CLI} Finished packaging ${name}`)
}

const packages = await glob(['packages/*', 'core'])

for (const pkg of packages) {
  const name = pkg.split('/')[1] ?? pkg
  await buildPackage(name, pkg)
}
for (const pkg of packages) {
  const name = pkg.split('/')[1] ?? pkg
  await replaceWorkspaceDeps(`publish/${name}`)
}
console.log(`${CLI} All packages built and ready for publish!`)