import fastifyPlugin from "fastify-plugin";

import ManifestsAbstract from "#manifests/manifestsAbstract.js";

class Manifests3 extends ManifestsAbstract {
  /**
   * @param {import("fastify").FastifyInstance} fastify
   */
  constructor(fastify) {
    super(fastify, 2, {});
  }
}

export default fastifyPlugin((fastify, options, done) => {
  fastify.decorate("manifests3", new Manifests3(fastify));
  done();
})