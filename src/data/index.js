import fastifyPlugin from "fastify-plugin"

import Annotations2 from "#annotations/annotations2.js";
import Annotations3 from "#annotations/annotations3.js";
import Manifests2 from "#manifests/manifests2.js";
import Manifests3 from "#manifests/manifests3.js";
import annotationsRoutes from "#annotations/routes.js";
import commonRoutes from "#data/routes.js";

/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */

/**
 * @param {FastifyInstanceType} fastify
 * @param {object} options
 */
function data(fastify, options, done) {

  fastify.register(Manifests2);
  fastify.register(Manifests3);
  fastify.register(Annotations2);
  fastify.register(Annotations3);
  fastify.register(commonRoutes, { });
  fastify.register(annotationsRoutes, { });

  done();
}

export default fastifyPlugin(data);
