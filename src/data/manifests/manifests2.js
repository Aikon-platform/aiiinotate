import fastifyPlugin from "fastify-plugin";

import ManifestsAbstract from "#manifests/manifestsAbstract.js";

class Manifests2 extends ManifestsAbstract {
  /**
   * @param {import("fastify").FastifyInstance} fastify
   */
  constructor(fastify) {
    super(fastify, 2, {});
  }
}

export default fastifyPlugin((fastify, options, done) => {
  fastify.decorate("manifests2", new Manifests2(fastify));
  done();
})

