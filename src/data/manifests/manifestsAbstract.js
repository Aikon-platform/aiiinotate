/** @typedef {import("mongodb").Db} Db */
/** @typedef {import("#data/types.js").FastifyInstanceType} FastifyInstanceType */

class ManifestsAbstract {
  /**
   * @param {FastifyInstanceType} fastify
   * @param {IiifPresentationVersionType} iiifPresentationVersion
   */
  constructor(fastify, iiifPresentationVersion) {
    const [ manifestsCollectionName, manifestsCollectionOptions ] =
    iiifPresentationVersion === 2
      ? [
        "manifests2",
        { validator: { /** TODO */ } }
      ]
      : [
        "manifests3",
        { validator: { /** TODO */ } }
      ];

    this.fastify = fastify;
    this.client = fastify.mongo.client;
    this.db = fastify.mongo.db;
    this.manifestsCollection = this.db.collection(
      manifestsCollectionName,
      manifestsCollectionOptions
    )
  }
}

export default ManifestsAbstract