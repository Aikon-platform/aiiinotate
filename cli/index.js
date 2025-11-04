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

import makeMongoClient from "#cli/mongoClient.js";
import makeImportCommand from "#cli/import.js";
import makeMigrateCommand from "#cli/migrate.js";
import makeServeCommand from "#cli/serve.js";


function makeCli() {

  const envFileOpt =
    new Option("--env <env-file>", "path to .env file").makeOptionMandatory();

  // console.log("@@@@@@@@@@@@@@@@@@@@@@", process.env.MONGODB_DB);
  const mongoClient = undefined; // await makeMongoClient();

  const cli = new Command();
  cli
    .name("aiiinotate-cli")
    .description("utility command line interfaces for aiiinotate")
    .addOption(envFileOpt)
    .hook("preAction", (thisCommand, actionCommand) => {
      process.env.ENV_FILE_PATH = thisCommand.opts().env;
      console.log("* preAction", process.env.ENV_FILE_PATH);
    })
    .addCommand(makeServeCommand())
    .addCommand(makeImportCommand(mongoClient))
    .addCommand(makeMigrateCommand(mongoClient));

  cli.parse(process.argv);
  return cli;
}

await makeCli();