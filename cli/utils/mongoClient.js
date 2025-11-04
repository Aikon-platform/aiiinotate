import { MongoClient } from "mongodb";

/**
 * load a mongo client and connect it to the database. exists if there's an error
 * @returns {import("mongodb").MongoClient}
 */
function loadMongoClient() {
  try {
    const client = new MongoClient(process.env.MONGODB_CONNSTRING);
    client.db(process.env.MONGODB_DB);
    return client;
  } catch (err) {
    console.error(`mongoClient: could not connect to DB because of error ${err.message}`);
    process.exit(1);
  }
}

export default loadMongoClient;