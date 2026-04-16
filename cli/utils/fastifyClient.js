import build from "#src/app.js";

/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */
/** @typedef {import("#types").FastifyReplyType} FastifyReplyType */
/** @typedef {import("#types").InsertResponseType} InsertResponseType */

/**
 * a client to interact with the fastify app.
 *
 * @example
 *  import FastifyClient from "#cli/utils/fastifyClient.js";
 *  const fastify = new FastifyClient();
 *  // load the fastify instance asynchronously
 *  await fastify.build();
 *  // run operations
 *  await fastify.importAnnotationList(...);
 */
class FastifyClient {
  constructor () { }

  // NOTE: instanciating this.fastify is asynchronous and a constructor must be synchronous,
  // so we use a builder to set this.fastify, following this pattern: https://stackoverflow.com/a/43433773
  async build() {
    /** @type {FastifyInstanceType} */
    this.fastify = await build("default");
    // TODO find way to actually completely disable logging because it makes the CLI UI uglyyy !
    // log only fastify errors
    this.fastify.log.level = "error";
  }

  async stop() {
    await this.fastify.close();
    this.fastify.log.info("fastify instance successfully closed.");
  }

  /**
   * @param {string} route
   * @returns {Promise<FastifyReplyType>}
   */
  injectGet(route) {
    return this.fastify.inject({
      method: "GET",
      url: route,
    })
  }

  /**
   * @param {string} route
   * @param {object} payload
   * @returns {Promise<FastifyReplyType>}
   */
  injectPost(route, payload) {
    return this.fastify.inject({
      method: "POST",
      url: route,
      payload: payload
    })
  }

  async importAnnotationPage(annotationPage) {
    // TODO
  }

  /**
   * function to interact with all annotation createMany + manifest create routes.
   * @type {(iiifVersion: 2|3, datatype: "manifest"|"annotation") => (data: object) => [Number, Promise<object>] }
   */
  importData(iiifVersion, datatype) {
    if ( !["2","3"].includes(`${iiifVersion}`) ) {
      throw new Error(`fastifyClient.importData: "iiifVersion" must by 2 or 3, got "${iiifVersion}"`);
    }
    if ( !["manifest","annotation"].includes(datatype) ) {
      throw new Error(`fastifyClient.importData: "datatype" must by "manifest" or "annotation", got "${datatype}"`);
    }

    const routeSuffix = datatype==="manifest" ? "create" : "createMany";
    const route = `/${datatype}s/${iiifVersion}/${routeSuffix}`;

    return async (data) => {
      const r = await this.injectPost(route, data);
      return [ r.statusCode, r.json() ];
    }
  }
}

export default FastifyClient;