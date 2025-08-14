/**
 * command line interface. run through the package.json.
 * usage: npm run cli import -- [args] [opts]
 */

import { Command, Option, Argument } from "commander";

import { makeImportCommand } from "#cli/import.js";

const cli = new Command();

cli
  .name("aiiinotate-cli")
  .description("utility command line interfaces for aiiinotate")
  .addCommand(makeImportCommand());

cli.parse();