import fastifyPlugin from 'fastify-plugin'
import fastifyMongo from '@fastify/mongodb'

import config from "#config/config.js";

/** @typedef {import('fastify').FastifyInstance} FastifyInstance */

/**
 * @param {FastifyInstance} fastify
 * @param {Object} options
 */
function dbConnector(fastify, options, done) {
  fastify.register(fastifyMongo, {
    forceClose: true,
    url: config.mongodbConnString
  })
  done();
}

// wrapping a plugin function with fastify-plugin exposes what is declared inside the plugin to the parent scope.
export default fastifyPlugin(dbConnector)