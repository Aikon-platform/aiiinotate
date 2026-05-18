import { MongoClient } from "mongodb";

import { MONGODB_CONNSTRING, MONGODB_DB } from "#constants";

/**
 * load a mongo client and connect it to the database. exists if there's an error
 * @returns {{ client: import("mongodb").MongoClient, db: import("mongodb").Db }}
 */
function loadMongoClient() {
  try {
    const
      client = new MongoClient(MONGODB_CONNSTRING),
      db = client.db(MONGODB_DB);
    return { client, db };
  } catch (err) {
    console.error(`mongoClient: could not connect to DB because of error ${err.message}`);
    process.exit(1);
  }
}

export default loadMongoClient;