import dotenvx from "@dotenvx/dotenvx";

import { fileOk } from "#cli/utilsIo.js";


async function loadEnv(envPath) {
  await fileOk(envPath);
  dotenvx.config({ path: envPath })
}