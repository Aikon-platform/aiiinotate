import serve from "#src/server.js";

import { Command, Option, Argument } from "commander";

/** @typedef {import("#types").RerveModeType} RerveModeType */

const serveModeValues = ["test", "dev", "prod"];

/**
 * @param {import('commander').Command} command
 * @param {RerveModeType} serveMode
 */
async function action(command, serveMode) {
  await serve(serveMode);
}

function makeServeCommand() {
  const serveModeArg =
    new Argument("<run-mode>", "mode with which to run the app")
    .choices(serveModeValues);

  return new Command("serve")
    .description("run Aiiinotate")
    .addArgument(serveModeArg)
    .action((serveMode, command) => action(command, serveMode));
}

export default makeServeCommand;
