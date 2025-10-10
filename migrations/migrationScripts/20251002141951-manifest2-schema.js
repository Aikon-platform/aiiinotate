/**
 * define the validation schema for collection `manifests2`.
 */

import build from "#src/app.js"

/**
 * @param db {import('mongodb').Db}
 * @param client {import('mongodb').MongoClient}
 * @returns {Promise<void>}
 */
export const up = async (db, client) => {
  const
    fastify = await build(),
    fastifySchema = fastify.schemasPresentation2.getSchema("manifestMongo"),
    schema = fastify.schemasToMongo(fastifySchema),
    commandDoc = {
      collMod: "manifests2",
      validator: { $jsonSchema: schema },
    },
    r = await db.command(commandDoc);


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
  const r = await db.command({
    collMod: "manifests2",
    validator: {}
  });
  if ( r.ok !== 1 ) {
    throw new Error(`command failed with error: ${r}`);
  }
};

