/**
 * build a fastify app
 */

import Fastify from "fastify";

import fileServer from "#fileServer/index.js";
import schemas from "#schemas/index.js";
import data from "#data/index.js";
import db from "#db/index.js";


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

  if ( ! allowedModes.includes(mode) ) {
    throw new Error(`app.build: 'mode' param expected one of ${allowedModes}, got ${mode}`)
  }

  const
    mongoConfig = mode==="test" ? testConfig.mongo : defaultConfig.mongo,
    fastifyConfig = mode==="test" ? testConfig.mongo : defaultConfig.mongo,
    fastify = Fastify(fastifyConfig);

  await fastify.register(db, mongoConfig);
  await fastify.register(fileServer);
  fastify.register(schemas);
  fastify.register(data);

  return fastify
}

export default build;

