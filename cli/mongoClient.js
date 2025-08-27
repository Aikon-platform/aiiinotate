import { MongoClient } from "mongodb";

import loadEnv from "#config/config.js";

loadEnv();

export default async function() {
  const client = new MongoClient(process.env.MONGODB_CONNSTRING);// new MongoClient(config.mongodbConnString);
  try {
    client.db(process.env.MONGODB_DB);  // client.db(config.mongodbName);
    return client;
  } catch (err) {
    console.log("cli/mongoClient: error connecting", err);
  }
}