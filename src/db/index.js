import fastifyPlugin from "fastify-plugin"
import fastifyMongo from "@fastify/mongodb"

/** @typedef {import('fastify').FastifyInstance} FastifyInstance */
/** @typedef {import('mongodb').Db} MongoDB */

/**
 * empty all collections. can only be used on the test database for obvious reasons.
 * @param {MongoDB} db
 */
const emptyCollections = async (db) => {
  if ( db.databaseName !== process.env.MONGODB_DB_TEST ) {
    throw new Error(`'emptyCollections' may only be used on test database defined by .env variable 'MONGODB_DB_TEST'. expected test database '${process.env.MONGODB_DB_TEST}' but working on database '${db.databaseName}'`);
  }
  await Promise.all(
    [
      "annotations3",
      "annotations2",
      "manifests3",
      "manifests2"
    ].map(async (collectionName) =>
      await db.collection(collectionName).deleteMany({})
    )
  )
};

/**
 * @param {FastifyInstance} fastify
 * @param {Object} options
 */
async function dbConnector(fastify, options) {
  const connString =
    options.test
      ? process.env.MONGODB_CONNSTRING_TEST
      : process.env.MONGODB_CONNSTRING;

  await fastify.register(fastifyMongo, {
    forceClose: true,
    url: connString
  });

  if ( options.test ) {
    fastify.decorate("emptyCollections", () => emptyCollections(fastify.mongo.db));
  }
}

// wrapping a plugin function with fastify-plugin exposes what is declared inside the plugin to the parent scope.
export default fastifyPlugin(dbConnector)
