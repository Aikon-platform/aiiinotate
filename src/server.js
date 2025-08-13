import routes from '#src/routes.js'
import dbConnector from '#db/connector.js'

/**
 * https://github.com/fastify/fastify-cli?tab=readme-ov-file#start
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} options
 */
export default async function start (fastify, options) {
  fastify.logger = true

  // load plugins. about plugin order,
  // see:
  //  load a plugin: https://fastify.dev/docs/latest/Guides/Getting-Started/#loading-order-of-your-plugins
  //  guide to plugins: https://fastify.dev/docs/latest/Guides/Plugins-Guide/
  fastify.register(dbConnector) // necessary to await to be sure the mongo client is connected
  fastify.register(routes)

  console.log(fastify.mongo.db)

  fastify.listen({ port: 3000 }, function (err, address) {
    if (err) {
      fastify.log.error(err)
      process.exit(1)
    }
  })
};
