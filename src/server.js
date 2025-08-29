import loadEnv from "#config/index.js";
import app from "#src/app.js";

loadEnv();

/**
 * https://github.com/fastify/fastify-cli?tab=readme-ov-file#start
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} options
 */
export default async function start (fastify, options) {

  fastify = await app(fastify, { logger: true });

  try {
    fastify.listen({ port: process.env.APP_PORT });
  } catch(err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
