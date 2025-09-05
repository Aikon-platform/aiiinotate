/**
 * define the validation schema on collection `annotations2`.
 */
import util from "node:util";

import build from "#src/app.js"

const inspect = (theObj) => util.inspect(theObj, {showHidden: false, depth: null, colors: true});

/**
 * @param db {import('mongodb').Db}
 * @param client {import('mongodb').MongoClient}
 * @returns {Promise<void>}
 */
export const up = async (db, client) => {
    // TODO apply schema using: https://www.mongodb.com/docs/manual/core/schema-validation/update-schema-validation/
    // the above link is for database commands.
    // see here how to use core database commands in node: https://www.mongodb.com/docs/drivers/node/current/run-command/#std-label-node-run-command
    const fastify = await build({});
    const fastifySchema = fastify.schemasPresentation2.getSchemaByUri("annotation");
    const schema = fastify.schemasToMongo(fastifySchema);

    const commandDoc = {
        collMod: "annotations2",
        validator: { $jsonSchema: schema }
    }
    console.log(">>> preConversion ", inspect(fastifySchema));
    console.log(">>> postConversion", inspect(commandDoc));

    const r = await db.command(commandDoc);
    if ( r.ok !== 1 ) {
        throw new Error(`command failed with error: ${r}`);
    }
};

/**
 * @param db {import('mongodb').Db}
 * @param client {import('mongodb').MongoClient}
 * @returns {Promise<void>}
 */
export const down = async (db, client) => {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
};
