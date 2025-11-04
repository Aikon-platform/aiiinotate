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

import makeMongoClient from "#cli/utils/mongoClient.js";
import makeImportCommand from "#cli/import.js";
import makeMigrateCommand from "#cli/migrate.js";
import makeServeCommand from "#cli/serve.js";
import loadEnv from "#cli/utils/env.js";


function makeCli() {

  const envFileOpt =
    new Option("--env <env-file>", "path to .env file").makeOptionMandatory();

  // NOTE: how do we load the env variables ? it's a bit unorthodox:
  // - the CLI requires to use a global `--env` option with a path to the .env file.
  // - we use the hook `preAction` that is called before any (sub-)command's `action` function is called.
  // - in the `preAction` hook, we call `loadEnv` that will load all env files defined in the `.env` file.
  // - this way, all env variables will be defined in the subcommand's `action` methods (and children).
  // WARNING: this means that the env variables can't be used in (sub-)commands BEFORE `action()` has been called.
  const cli = new Command();
  cli
    .name("aiiinotate-cli")
    .description("utility command line interfaces for aiiinotate")
    .addOption(envFileOpt)
    .hook("preAction", (thisCommand, actionCommand) => {
      loadEnv(thisCommand.opts().env);
    })
    .addCommand(makeServeCommand())
    .addCommand(makeImportCommand())
    .addCommand(makeMigrateCommand());

  cli.parse(process.argv);
  return cli;
}

await makeCli();