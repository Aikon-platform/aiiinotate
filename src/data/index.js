import fastifyPlugin from "fastify-plugin"

import Annotations2 from "#annotations/annotations2/annotations2.js";
import Annotations3 from "#annotations/annotations3/annotations3.js";
import Manifests2 from "#annotations/annotations2/manifests2.js";
import Manifests3 from "#annotations/annotations3/manifests3.js";
import annotationsRoutes from "#annotations/routes.js";
import commonRoutes from "#data/routes.js";


/**
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} options
 */
function data(fastify, options, done) {

  const
    db = fastify.mongo.db,
    client = fastify.mongo.client,
    manifests2 = new Manifests2(fastify, client, db),
    manifests3 = new Manifests3(fastify, client, db),
    annotations2 = new Annotations2(fastify, client, db),
    annotations3 = new Annotations3(fastify, client, db);

  fastify.register(commonRoutes, { annotations2, annotations3 });
  fastify.register(annotationsRoutes, { annotations2, annotations3 });

  done();
}

export default fastifyPlugin(data);
