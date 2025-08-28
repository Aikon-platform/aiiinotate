import fastifyPlugin from "fastify-plugin"

import Annotations2 from "#annotations/annotations2/annotations2.js";
import Annotations3 from "#annotations/annotations3/annotations3.js";
import annotationRoutes from "#annotations/routes.js";


/**
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} options
 */
async function data(fastify, options) {

  const db = fastify.mongo.db;

  const annotations2 = new Annotations2(
    fastify.mongo.client,
    db
  );
  const annotations3 = new Annotations3(
    fastify.mongo.client,
    db
  );

  fastify.register(annotationRoutes, { annotations2, annotations3 });
  return

}

export default fastifyPlugin(data);
