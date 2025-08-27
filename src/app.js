import routes from "#src/routes.js";
import dbConnector from "#db/connector.js";

// import Fastify from "fastify";

/**
 * @param {import('fastify').FastifyInstance} fastify
 */
async function app(fastify) {
  // config
  fastify.logger = true;

  // load plugins
  // see:
  //  load a plugin: https://fastify.dev/docs/latest/Guides/Getting-Started/#loading-order-of-your-plugins
  //  guide to plugins: https://fastify.dev/docs/latest/Guides/Plugins-Guide/
  //  plugins encapsulation: https://fastify.dev/docs/latest/Guides/Plugins-Guide/#how-to-handle-encapsulation-and-distribution
  fastify.register(dbConnector);
  await fastify.after();  // `dbConnector` is async so we need to wait for completion
  fastify.register(routes);

  return fastify
}

export default app

