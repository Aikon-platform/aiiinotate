#!/usr/bin/env node

/**
 * command line interface. run through the package.json.
 * usage: npm run cli import -- [args] [opts]
 *
 * NOTE: node recommends only creating 1 mongoclient per app
 * when possible for performance reasons => we create a global mongoClient
 * here, and then pass it down to all the other scripts.
 */

import { Command } from "commander";

import makeMongoClient from "#cli/mongoClient.js";
import makeImportCommand from "#cli/import.js";
import makeMigrateCommand from "#cli/migrate.js";
import makeServeCommand from "#cli/serve.js";

const cli = new Command();

console.log("@@@@@@@@@@@@@@@@@@@@@@", process.env.MONGODB_DB);
const mongoClient = await makeMongoClient();

cli
  .name("aiiinotate-cli")
  .description("utility command line interfaces for aiiinotate")
  .addCommand(makeServeCommand())
  .addCommand(makeImportCommand(mongoClient))
  .addCommand(makeMigrateCommand(mongoClient));

cli.parse(process.argv);