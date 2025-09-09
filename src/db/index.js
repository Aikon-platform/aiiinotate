import fastifyPlugin from "fastify-plugin"
import fastifyMongo from "@fastify/mongodb"

/** @typedef {import('fastify').FastifyInstance} FastifyInstance */

/**
 * @param {FastifyInstance} fastify
 * @param {Object} options
 */
function dbConnector(fastify, options, done) {
  const connString =
    options.test
      ? process.env.MONGODB_CONNSTRING_TEST
      : process.env.MONGODB_CONNSTRING;

  fastify.register(fastifyMongo, {
    forceClose: true,
    url: connString
  });

  done();
}

// wrapping a plugin function with fastify-plugin exposes what is declared inside the plugin to the parent scope.
export default fastifyPlugin(dbConnector)
