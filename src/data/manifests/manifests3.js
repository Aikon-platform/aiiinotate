import fastifyPlugin from "fastify-plugin";

import ManifestsAbstract from "#manifests/manifestsAbstract.js";

/** @typedef {import("#data/types.js").FastifyInstanceType} FastifyInstanceType */

class Manifests3 extends ManifestsAbstract {
  /**
   * @param {FastifyInstanceType} fastify
   */
  constructor(fastify) {
    super(fastify, 2, {});
  }
}

export default fastifyPlugin((fastify, options, done) => {
  fastify.decorate("manifests3", new Manifests3(fastify));
  done();
}, {
  name: "manifests3",
})