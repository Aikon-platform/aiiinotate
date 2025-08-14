import { MongoClient } from "mongodb";

import config from "#config/config.js";



export default async function() {
    const client = new MongoClient(config.mongodbConnString);
    try {
        const db = client.db(config.mongodbName);
        return {client, db};
    } catch (err) {
        console.log("cli/mongoClient: error connecting", err);
    }
}