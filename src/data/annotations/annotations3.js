import fastifyPlugin from "fastify-plugin";

import CollectionAbstract from "#data/collectionAbstract.js";

/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */

/** @typedef {Annotations3} Annotations3InstanceType */

/**
 * @extends {CollectionAbstract}
 */
class Annotations3 extends CollectionAbstract {
  /**
   * @param {FastifyInstanceType} fastify
   */
  constructor(fastify) {
    super(fastify, "annotations3");
  }

}

export default fastifyPlugin((fastify, options, done) => {
  fastify.decorate("annotations3", new Annotations3(fastify));
  done();
}, {
  name: "annotations3",
  dependencies: ["manifests3"]
})