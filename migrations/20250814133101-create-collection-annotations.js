/**
 * create the `annotation` collection with the proper schema
 */

import { annotationSchema } from '#annotation/annotationModel.js';

const collectionName = "annotations";

/**
 * @param {import('mongodb').Db} db
 * @param {import('mongodb').MongoClient} client
 * @returns {Promise<void>}
 */
export const up = async (db, client) => {
    // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
    db.createCollection(collectionName, {
        validator: annotationSchema,
        validationLevel: "strict",
    });
};

/**
 * @param {import('mongodb').Db} db
 * @param {import('mongodb').MongoClient} client
 * @returns {Promise<void>}
 */
export const down = async (db, client) => {
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
    const collection = db.collection(collectionName);
    await collection.drop()
}
