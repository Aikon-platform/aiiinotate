import { MongoClient } from "mongodb";

import config from "#config/config.js";



export default async function() {
    const client = new MongoClient(config.mongodbConnString);
    try {
        client.db(config.mongodbName);
        return client;
    } catch (err) {
        console.log("cli/mongoClient: error connecting", err);
    }
}