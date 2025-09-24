/** @typedef {import("mongodb").Db} Db */

class ManifestsAbstract {
  /**
   * @param {import("mongodb").Db} db
   * @param {import("mongodb").MongoClient} client
   * @param {"annotations2"|"annotations3"} manifestsCollectionName
   * @param {object} manifestsCollectionOptions
   */
  constructor(client, db, manifestsCollectionName, manifestsCollectionOptions) {
    this.client = client;
    this.db = db;
    this.manifestsCollection = db.collection(
      manifestsCollectionName,
      manifestsCollectionOptions
    )
  }
}

export default ManifestsAbstract