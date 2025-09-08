/**
 * serve a fastify app
 */

import build from "#src/app.js";

/**
 * @param {object} options
 */
async function start (options) {

  const fastify = await build();

  try {
    fastify.listen({ port: process.env.APP_PORT });
  } catch(err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();