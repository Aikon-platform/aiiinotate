import fastifyPlugin from 'fastify-plugin'
import fastifyMongo from '@fastify/mongodb'

import config from "#config/config.js";

/**
 *
 * @param {FastifyInstance} fastify
 * @param {Object} options
 */
async function dbConnector(fastify, options) {
  fastify.register(fastifyMongo, {
    forceClose: true,
    url: config.mongodbConnString
  })
}

// wrapping a plugin function with fastify-plugin exposes what is declared inside the plugin to the parent scope.
export default fastifyPlugin(dbConnector)