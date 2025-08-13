import { annotationSchema } from '#annotation/annotationInternal.js';

/**
 * @param {import("mongodb").Db} db
 * @param {object} options
 */
async function createCollection(db, options) {
    return db.createCollection("annotation", {
        validator: {
            $jsonSchema: annotationSchema
        }
    })
}

/**
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} options
 */
async function annotation(fastify, options, done) {
  await createCollection(fastify.db);
  done();
}