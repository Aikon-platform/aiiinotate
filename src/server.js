/**
 * serve a fastify app
 */

import build from "#src/app.js";
import { PORT, HOST } from "#constants";

/**
 * @param {import("#types").ServeModeType} serveMode
 */
async function server (serveMode) {
  if ([ "dev", "prod" ].includes(serveMode)) {
    serveMode = "default";
  }

  const fastify = await build(serveMode);
  try {
    fastify.listen({ port: PORT, host: HOST });
  } catch(err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

export default server;
