import fastifyPlugin from "fastify-plugin";

import CollectionAbstract from "#data/collectionAbstract.js";

/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */

/** @typedef {Annnotations3} Annotations3InstanceType */

/**
 * @extends {CollectionAbstract}
 */
class Annnotations3 extends CollectionAbstract {
  /**
   * @param {FastifyInstanceType} fastify
   */
  constructor(fastify) {
    super(fastify, "annotations3");
  }

  notImplementedError() {
    throw this.errorNoAction(`${this.constructor.name}: not implemented`);
  }

}

export default fastifyPlugin((fastify, options, done) => {
  fastify.decorate("annnotations3", new Annnotations3(fastify));
  done();
}, {
  name: "annotations3",
  dependencies: ["manifests3"]
})