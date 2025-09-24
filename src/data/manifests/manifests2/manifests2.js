import ManifestsAbstract from "#manifests/manifestsAbstract.js";

class Manifests2 extends ManifestsAbstract {
  /**
   * @param {import("fastify").FastifyInstance} fastify
   * @param {import("mongodb").MongoClient} client
   * @param {import("mongodb").Db} db
   */
  constructor(fastify) {
    super(fastify, 2, {});
  }
}

export default Manifests2;

