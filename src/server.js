import routes from "#src/routes.js";
import dbConnector from "#db/index.js";
import data from "#data/index.js";

// import app from "#src/app.js";


/**
 * https://github.com/fastify/fastify-cli?tab=readme-ov-file#start
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} options
 */
export default async function start (fastify, options) {
  // fastify = await app(fastify);

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
  fastify.register(data);
  await fastify.after();

  try {
    fastify.listen({ port: process.env.APP_PORT })
  } catch (err) {
    console.log(">>> 5 hellllllllllllllllllllo")
    fastify.log.error(err)
    process.exit(1)
  }
};
