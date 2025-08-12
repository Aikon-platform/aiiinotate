"use strict"

import fastifyMongodb from "@fastify/mongodb";

import routes from '#src/routes.js';
import dbConnector from "#db/connector.js";

// /**
//  * @type {import('fastify').FastifyInstance}
//  */
// const fastify = Fastify({
//   logger: true
// });

// fastify.register(routes);

// const start = async () => {
//   try {
//     fastify.listen({ port: 3000 })
//   } catch (err) {
//     fastify.log.error(err);
//     process.exit(1);
//   }
// }

/**
 * https://github.com/fastify/fastify-cli?tab=readme-ov-file#start
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} options
 */
export default async function start (fastify, options) {

  fastify.logger = true;

  fastify.register(dbConnector);
  fastify.register(routes);

  try {
    fastify.listen({ port: 3000 })
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};