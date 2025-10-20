/**
 * build a fastify app
 */

import Fastify from "fastify";
import cors from "@fastify/cors";

import fileServer from "#fileServer/index.js";
import schemas from "#schemas/index.js";
import data from "#data/index.js";
import db from "#db/index.js";

/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */

const fastifyConfigCommon = {
  bodyLimit: 10 * 1048576  // 10 MiB
}

const testConfig = {
  fastify: {
    ...fastifyConfigCommon
  },
  mongo: {
    test: true,
  }
}

const defaultConfig = {
  fastify: {
    logger: true,
    ...fastifyConfigCommon
  },
  mongo: { }
}

const allowedModes = ["test", "default"]

/**
 * @param {"test"|"default"} mode
 * @returns {Promise<FastifyInstanceType>}
 */
async function build(mode="default") {

  if ( ! allowedModes.includes(mode) ) {
    throw new Error(`app.build: 'mode' param expected one of ${allowedModes}, got ${mode}`)
  }

  const
    mongoConfig = mode==="test" ? testConfig.mongo : defaultConfig.mongo,
    fastifyConfig = mode==="test" ? testConfig.fastify : defaultConfig.fastify,
    fastify = Fastify(fastifyConfig);

  // NOTE: we allow all origins => restrict ?
  fastify.register(cors, {
    origin: "*",
    methods: ["GET", "HEAD", "POST", "DELETE"]
  });

  await fastify.register(db, mongoConfig);
  await fastify.register(fileServer);
  fastify.register(schemas);
  fastify.register(data);
  await fastify.ready();

  return fastify
}

export default build;

