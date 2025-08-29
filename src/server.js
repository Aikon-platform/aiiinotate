/**
 * serve a fastify app
 */

import loadEnv from "#config/index.js";
import build from "#src/app.js";

loadEnv();

/**
 * @param {object} options
 */
async function start (options) {

  const fastify = await build({ logger: true });

  try {
    fastify.listen({ port: process.env.APP_PORT });
  } catch(err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();