/**
 * build a fastify app
 */

import Fastify from "fastify";
import cors from "@fastify/cors";
// import swagger from "@fastify/swagger";

import fileServer from "#fileServer/index.js";
import schemas from "#schemas/index.js";
import data from "#data/index.js";
import db from "#db/index.js";

/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */

const fastifyConfigCommon = {
  bodyLimit: 100 * 1048576  // 100 MiB
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

//NOTE: couldn´t get fastify/swagger to work for now...
// const swaggerConfig = {
//   openapi: {
//     openapi: "3.0.0",
//     info: {
//       title: "Aiiinotate",
//       description: "A fast and lightweight IIIF annotations server",
//       version: "1.0.0",
//     },
//     servers: [
//       {
//         url: process.env.APP_BASE_URL,
//         description: "Aiiinotate URL"
//       }
//     ],
//     // tags: [],
//     // components: {},
//     // externalDocs: {
//     //   url: 'https://swagger.io',
//     //   description: 'Find more info here'
//     // }
//   },
//
//   // swagger: {
//   //   info: {
//   //     title: "Aiiinotate",
//   //     description: "A fast and lightweight IIIF annotations server",
//   //     version: "1.0.0",
//   //   },
//   //   externalDocs: {
//   //     url: 'https://swagger.io',
//   //     description: 'Find more info here'
//   //   },
//   //   host: process.env.APP_BASE_URL.replace(/^http(s)?\:\/\//g, ""),  // process.env.APP_BASE_URL,
//   //   schemes: [ "http", "https" ],
//   //   consumes: ['application/json'],
//   //   produces: ['application/json'],
//   //   tags: [ Object ],
//   // },
//   hideUntagged: false,
//   exposeRoute: true,
// }

const allowedModes = ["test", "default"];

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

