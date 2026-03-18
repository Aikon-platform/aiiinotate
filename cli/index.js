#!/usr/bin/env node

/**
 * command line interface. run through the package.json.
 * usage: npm run cli import -- [args] [opts]
 *
 * NOTE: node recommends only creating 1 mongoclient per app
 * when possible for performance reasons => we create a global mongoClient
 * here, and then pass it down to all the other scripts.
 */

import { Command, Option } from "commander";

// import dotenvx from "dotenvx";

import makeImportCommand from "#cli/import.js";
import makeMigrateCommand from "#cli/migrate.js";
import makeServeCommand from "#cli/serve.js";
import loadEnv from "#cli/utils/env.js";


function makeCli() {

  const desc =
    "Command line interface for aiiinotate.\n\n"
    + `All commands are accessible through this CLI: starting the app,
    managing and running migrations, importing and exporting data.
    Run individual commands to see command-specific help.
    `.replace(/^\s+/gm, "");

  const envFileOpt =
    new Option("--env <env-file>", "path to .env file").makeOptionMandatory();

  // NOTE: before running, it is necessary to load env variables.
  const cli = new Command();
  cli
    .name("aiiinotate")
    .description(desc)
    .addCommand(makeServeCommand())
    .addCommand(makeImportCommand())
    .addCommand(makeMigrateCommand());

  cli.parse(process.argv);
  return cli;
}

await makeCli();