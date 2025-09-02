/**
 * build a fastify app
 */

import Fastify from "fastify";

import dbConnector from "#db/index.js";
import routes from "#src/routes.js";
import data from "#data/index.js";
import schemas from "#src/schemas/index.js";

/**
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} options
 */
async function build(options) {

  const fastify = Fastify(options);

  // load plugins
  // see:
  //  load a plugin: https://fastify.dev/docs/latest/Guides/Getting-Started/#loading-order-of-your-plugins
  //  guide to plugins: https://fastify.dev/docs/latest/Guides/Plugins-Guide/
  //  plugins encapsulation: https://fastify.dev/docs/latest/Guides/Plugins-Guide/#how-to-handle-encapsulation-and-distribution
  await fastify.register(dbConnector);
  fastify.register(routes);
  await fastify.register(schemas);
  fastify.register(data);

  console.log("src/app.js schemas", fastify.getSchemas());
  console.log("src/app.js", fastify.schemasBase.makeSchemaUri);

  return fastify
}

export default build;

