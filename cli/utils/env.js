import dotenvx from "@dotenvx/dotenvx";

import { fileOk } from "#cli/utils/io.js";

/**
 * check that the `--env` provided by the user exists. if it exists, load variables, otherwise exit.
 * @param {string} envPath
 */
async function loadEnv(envPath) {
  if ( !fileOk(envPath) ){
    console.error(`env.loadEnv: envPath provided by '--env' not found at '${envPath}'. exiting...`);
    process.exit(1);
  };
  dotenvx.config({ path: envPath })
}

export default loadEnv