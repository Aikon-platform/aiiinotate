/**
 * build a fastify app
 */

import Fastify from "fastify";

import dbConnector from "#db/index.js";
import routes from "#src/routes.js";
import data from "#data/index.js";
import schemas from "#schemas/index.js";


const testConfig = {
  fastify: {

  },
  mongo: {
    test: true,
  }
}

const defaultConfig = {
  fastify: {
    logger: true,
  },
  mongo: { }
}

const allowedModes = ["test", "default"]


/**
 * @param {import('fastify').FastifyInstance} fastify
 * @param {"test"|"default"} mode
 * @returns {import('fastify').FastifyInstance}
 */
async function build(mode="default") {

  if ( allowedModes.includes(mode) ) {
    throw new Error(`app.build: 'mode' param expected one of ${allowedModes}, got ${mode}`)
  }

  const
    mongoConfig = mode==="test" ? testConfig.mongo : defaultConfig.mongo,
    fastifyConfig = mode==="test" ? fastifyConfig.mongo : fastifyConfig.mongo,
    fastify = Fastify(mongoConfig);

  // load plugins
  // see:
  //  load a plugin: https://fastify.dev/docs/latest/Guides/Getting-Started/#loading-order-of-your-plugins
  //  guide to plugins: https://fastify.dev/docs/latest/Guides/Plugins-Guide/
  //  plugins encapsulation: https://fastify.dev/docs/latest/Guides/Plugins-Guide/#how-to-handle-encapsulation-and-distribution
  await fastify.register(dbConnector, fastifyConfig);
  fastify.register(routes);
  await fastify.register(schemas);
  fastify.register(data);

  return fastify
}

export default build;

