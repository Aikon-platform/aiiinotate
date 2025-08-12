"use strict"

import fastifyMongodb from "@fastify/mongodb";

import routes from '#src/routes.js'
import { loadEnv, config } from "#config/config.js";

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

loadEnv();

console.log(config.mongodbConnString);

/**
 * https://github.com/fastify/fastify-cli?tab=readme-ov-file#start
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} options
 */
export default async function start (fastify, options) {
  fastify.logger = true;
  fastify.register(routes);

  // fastify.register(fastifyMongodb, {
  //   forceClose: true,
  // })

  try {
    fastify.listen({ port: 3000 })
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};