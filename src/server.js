/**
 * serve a fastify app
 */

import build from "#src/app.js";

/**
 * @param {import("#types").RerveModeType} serveMode
 */
async function server (serveMode) {
  if (["dev", "prod"].includes(serveMode)) {
    serveMode = "default";
  }

  const fastify = await build(serveMode);

  try {
    fastify.listen({ port: process.env.APP_PORT });
  } catch(err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

export default server;