import build from "#src/app.js";

/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */
/** @typedef {import("#types").FastifyReplyType} FastifyReplyType */

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
  }

  async stop() {
    await this.fastify.close();
    console.log("fastify instance successfully closed.");
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

  async importAnnotationList(annotationList) {
    const r = await this.injectPost("/annotations/2/createMany", annotationList);
    console.log(await r.json())
    return r;
  }
}

export default FastifyClient;