#!/usr/bin/env node
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { runAdd } from './commands/add'
import { runInit } from './commands/init'
import { runList } from './commands/list'

await yargs(hideBin(process.argv))
  .scriptName('asterflow')
  .command(
    'init [directory]',
    'Scaffold a new AsterFlow project',
    (cmdYargs) => cmdYargs.positional('directory', {
      type: 'string',
      describe: 'Directory to create the project in (defaults to the current directory)'
    }),
    async (argv) => {
      await runInit({ directory: argv.directory })
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
  .demandCommand(1, 'Specify a command: init, add or list')
  .strict()
  .help()
  .alias('help', 'h')
  .parse()
