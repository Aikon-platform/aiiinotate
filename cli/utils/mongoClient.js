import { MongoClient } from "mongodb";

import { MONGODB_CONNSTRING, MONGODB_DB } from "#constants";

/**
 * load a mongo client and connect it to the database. exists if there's an error
 * @returns {import("mongodb").MongoClient}
 */
function loadMongoClient() {
  try {
    const client = new MongoClient(MONGODB_CONNSTRING);
    client.db(MONGODB_DB);
    return client;
  } catch (err) {
    console.error(`mongoClient: could not connect to DB because of error ${err.message}`);
    process.exit(1);
  }
}

export default loadMongoClient;