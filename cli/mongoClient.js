import { MongoClient } from "mongodb";

export default async function() {
  const client = new MongoClient(process.env.MONGODB_CONNSTRING);
  try {
    client.db(process.env.MONGODB_DB);  // client.db(config.mongodbName);
    return client;
  } catch (err) {
    console.log("cli/mongoClient: error connecting", err);
  }
}