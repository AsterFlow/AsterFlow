#!/usr/bin/env node
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { runAdd } from './commands/add'
import { runGenerate } from './commands/generate'
import { runInit } from './commands/init'
import { runList } from './commands/list'
import { ADAPTER_IDS } from './registry/adapters'
import { TEMPLATE_IDS } from './registry/templates'

// Wrapped in an async IIFE (no top-level `await`) so this also builds to
// CommonJS - `dist/cjs/index.cjs` is what the published `bin` entry runs,
// and esbuild's cjs output format doesn't support top-level await at all.
void (async () => {
  await yargs(hideBin(process.argv))
    .scriptName('asterflow')
    .command(
      'init [directory]',
      'Scaffold a new AsterFlow project',
      (cmdYargs) => cmdYargs
        .positional('directory', {
          type: 'string',
          describe: 'Directory to create the project in (defaults to the current directory)'
        })
        .option('name', {
          type: 'string',
          describe: 'Project name (defaults to the directory name)'
        })
        .option('adapter', {
          type: 'string',
          describe: `Adapter to use (${ADAPTER_IDS.join(', ')})`
        })
        .option('plugins', {
          type: 'string',
          describe: 'Comma-separated plugin ids, e.g. fs,multipart'
        })
        .option('routes', {
          type: 'string',
          describe: `Comma-separated route template ids to scaffold, or "none" (${TEMPLATE_IDS.join(', ')})`
        })
        .option('install', {
          type: 'boolean',
          describe: 'Install dependencies (default: yes)'
        })
        .option('skip-install', {
          type: 'boolean',
          describe: 'Alias for --no-install'
        })
        .option('git', {
          type: 'boolean',
          describe: 'Initialize a git repository (default: yes)'
        })
        .option('use-npm', { type: 'boolean', describe: 'Install dependencies with npm' })
        .option('use-pnpm', { type: 'boolean', describe: 'Install dependencies with pnpm' })
        .option('use-yarn', { type: 'boolean', describe: 'Install dependencies with yarn' })
        .option('use-bun', { type: 'boolean', describe: 'Install dependencies with bun' })
        .option('yes', {
          type: 'boolean',
          describe: 'Accept defaults for anything not explicitly set, without prompting'
        }),
      async (argv) => {
        const packageManager = argv.useNpm ? 'npm' : argv.usePnpm ? 'pnpm' : argv.useYarn ? 'yarn' : argv.useBun ? 'bun' : undefined

        await runInit({
          directory: argv.directory,
          name: argv.name,
          adapter: argv.adapter,
          plugins: argv.plugins,
          routes: argv.routes,
          install: argv.skipInstall ? false : argv.install,
          git: argv.git,
          packageManager,
          yes: argv.yes
        })
      }
    )
    .command(
      'add <names>',
      'Add one or more plugins to the current project',
      (cmdYargs) => cmdYargs
        .positional('names', {
          type: 'string',
          describe: 'Comma-separated plugin names, e.g. fs,multipart',
          demandOption: true
        })
        .option('directory', {
          alias: 'C',
          type: 'string',
          describe: 'Project directory (defaults to the current directory)'
        }),
      async (argv) => {
        await runAdd({ names: argv.names, directory: argv.directory })
      }
    )
    .command(
      'list',
      'List available plugins',
      () => {},
      () => runList()
    )
    .command(
      'generate [directory]',
      'Generate the static route manifest consumed by @asterflow/fs (fs-routing)',
      (cmdYargs) => cmdYargs
        .positional('directory', {
          type: 'string',
          describe: 'Routes directory to scan (defaults to src/routes)'
        })
        .option('out', {
          alias: 'o',
          type: 'string',
          describe: 'Output file for the generated manifest (defaults to src/routes.gen.ts)'
        })
        .option('watch', {
          alias: 'w',
          type: 'boolean',
          describe: 'Regenerate whenever a file under the routes directory changes'
        }),
      async (argv) => {
        await runGenerate({ directory: argv.directory, out: argv.out, watch: argv.watch })
      }
    )
    .demandCommand(1, 'Specify a command: init, add, list or generate')
    .strict()
    .help()
    .alias('help', 'h')
    .parse()
})().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
