import fastifyPlugin from "fastify-plugin"

import Annotations2 from "#annotations/annotations2.js";
import Annotations3 from "#annotations/annotations3.js";
import Manifests2 from "#manifests/manifests2.js";
import Manifests3 from "#manifests/manifests3.js";
import annotationsRoutes from "#annotations/routes.js";
import commonRoutes from "#data/routes.js";


/**
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} options
 */
function data(fastify, options, done) {

  // const
  //   db = fastify.mongo.db,
  //   client = fastify.mongo.client,
  //   manifests2 = new Manifests2(fastify, client, db);
  //   // manifests3 = new Manifests3(fastify, client, db);
  //   // annotations2 = new Annotations2(fastify, client, db),
  //   // annotations3 = new Annotations3(fastify, client, db);

  fastify.register(Annotations2);
  fastify.register(Annotations3);
  fastify.register(Manifests2);
  fastify.register(Manifests3);

  fastify.register(commonRoutes, { });
  fastify.register(annotationsRoutes, { });

  done();
}

export default fastifyPlugin(data);
