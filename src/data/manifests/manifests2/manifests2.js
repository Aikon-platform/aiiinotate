import ManifestsAbstract from "#manifests/manifests2.js";

class Manifests2 extends ManifestsAbstract {
  /**
   * @param {import("fastify").FastifyInstance} fastify
   * @param {import("mongodb").MongoClient} client
   * @param {import("mongodb").Db} db
   */
  constructor(fastify, client, db) {
    super(client, db, "manifests2", {});
  }
}

export default Manifests2;

