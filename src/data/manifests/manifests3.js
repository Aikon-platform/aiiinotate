import fastifyPlugin from "fastify-plugin";

import CollectionAbstract from "#data/collectionAbstract.js";

/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */

class Manifests3 extends CollectionAbstract {
  /**
   * @param {FastifyInstanceType} fastify
   */
  constructor(fastify) {
    super(fastify, "manifests3");
  }
}

export default fastifyPlugin((fastify, options, done) => {
  fastify.decorate("manifests3", new Manifests3(fastify));
  done();
}, {
  name: "manifests3",
})