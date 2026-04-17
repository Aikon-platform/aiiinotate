import serve from "#src/server.js";

import { Command, Option, Argument } from "commander";

/** @typedef {import("#types").ServeModeType} ServeModeType */

const serveModeValues = [ "dev", "prod" ];

/**
 * @param {import('commander').Command} command
 * @param {ServeModeType} serveMode
 */
async function action(command, serveMode) {
  await serve(serveMode);
}

function makeServeCommand() {

  const serveModeArg =
    new Argument("<run-mode>", "mode with which to run the app")
      .choices(serveModeValues);

  return new Command("serve")
    .description("run Aiiinotate. <run-mode>")
    .addArgument(serveModeArg)
    .action((serveMode, command) => action(command, serveMode));
}

export default makeServeCommand;
