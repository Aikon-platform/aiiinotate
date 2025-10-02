import { maybeToArray } from "#utils/utils.js"
import { makeInsertResponse, makeDeleteResponse, makeUpdateResponse } from "#utils/responseUtils.js";

/** @typedef {import("#types").MongoDbType} MongoDbType */
/** @typedef {import("#types").IiifPresentationVersionType} IiifPresentationVersionType */
/** @typedef {import("#types").CollectionNamesType} CollectionNamesType */
/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */
/** @typedef {import("#types").DataOperationsType } DataOperationsType */

const allowedCollectionNames = ["manifests2", "manifests3", "annotations2", "annotations3"];

class CollectionAbstractError extends Error {
  /**
   * @param {string?} collectionName: name of the collection we're working on
   * @param {string} message: error message
   * @param {DataOperationsType} action: to describe the type of database interaction
   * @param {object} errInfo: extra info to display for the error
   */
  constructor(collectionName, action, message, errInfo) {
    const
      collInfo = collectionName ? `on collection '${collectionName}',` : "",
      actionInfo = action ? `when performing operation '${action.toLocaleLowerCase()}'`: "";
    super(`CollectionAbstractError: ${collInfo} ${actionInfo}: ${message}`);
    this.info = errInfo;
  }
}

/**
 * @param {string?} collectionName
 * @returns {Function}
 */
const errorConstructor = (collectionName) =>
  /**
   * @param {string?} action
   * @returns {Function}
   */
  (action) =>
    /**
     *
     * @param {string} message
     * @param {object} errInfo
     * @returns {CollectionAbstractError}
     */
    (message, errInfo) =>
      new CollectionAbstractError(collectionName, message, action, errInfo);

// an error with no collection name or info.
const abstractError = errorConstructor(undefined)(undefined);

/**
 * abstract class defining common processes to interact with a mongo collectios: inserts, updates, errors...
 * this class contains agnostic methods and data that can be applied to any collection.
 */
class CollectionAbstract {
  /**
   * @param {FastifyInstanceType} fastify
   * @param {CollectionNamesType} collectionName
   */
  constructor(fastify, collectionName) {

    if ( !allowedCollectionNames.includes(collectionName) ) {
      throw new abstractError(`invalid 'collectionName': expected one of ${allowedCollectionNames}, got '${collectionName}'`);
    }

    const collectionOptions =
      collectionName === "annotations2"
        ? { validator: { $jsonSchema: fastify.schemasPresentation2.getSchema("annotation") } }
        : collectionName === "annotations3"
          ? { validator: { /** TODO */ } }
          : collectionName === "manifests2"
            ? { validator: { $jsonSchema: fastify.schemasPresentation2.getSchema("manifest") } }
          // else: manifets3.
            : { validator: { /** TODO */ }};

    const iiifPresentationVersion = collectionName.endsWith("2") ? 2 : 3;

    this.fastify = fastify;
    this.client = fastify.mongo.client;
    this.db = fastify.mongo.db;
    this.collection = this.db.collection(collectionName, collectionOptions);
    this.iiifPresentationVersion = iiifPresentationVersion;

    /** @type {Function(string?) => Function(string, object) => Error} */
    this.errorConstructor = errorConstructor(collectionName);
    /** @type {Function(string, object?) => Error} */
    this.errorNoAction = this.errorConstructor(undefined);
    // create this.error(Read|Insert|Update|Delete), properties that will be used to throw the proper error.
    [ "read", "insert", "update", "delete" ].forEach((op) =>
      /** @type {Function(string,object?) => Error} */
      this[`${op}Error`] = errorConstructor(collectionName)(op)
    )
  }

  //////////////////////////////////////
  // UTILS

  /** @returns {string} */
  className() {
    return this.constructor.name;
  }

  /** @param {function} func */
  funcName(func) {
    if ( typeof func !== "function" ) {
      throw new Error(`${this.className()}.${this.funcName.name} : expected 'func' to be a function, got '${typeof func}' (func = ${func})`);
    }
    return `${this.className()}.${func.name}`
  }

  /**
   * TODO delete / replace by this.error* functions.
   * generate an error message, with format: className.funcName: errMsg
   * @param {string} func
   * @param {string} msg
   * @param {boolean} throwErr: if true, throw the error. otherwise, print the error message and return it
   * @returns {string?}
   */
  errorMessage(func, msg, throwErr=true) {
    msg = `${this.funcName(func)} : ${msg}`;
    if ( throwErr ) {
      throw new Error(msg);
    } else {
      console.error(msg);
      return msg;
    }
  }

  /**
   * resolve internal mongo '_id' fields to iiif '@id' fields
   * @param {MongoCollectionType} collection
   * @param {string | string[]} mongoIds
   * @returns {Promise<string[]>}
   */
  async getIiifIdsFromMongoIds(mongoIds) {
    mongoIds = maybeToArray(mongoIds);
    const key = this.iiifPresentationVersion === 2 ? "@id" : "id";
    const annotationIds = await this.collection.find(
      { _id: { $in: mongoIds } },
      { projection: { [key]: 1 } }
    ).toArray();
    return annotationIds.map(a => a[key]);
  }


  //////////////////////////////////////
  // RESPONSES: what is sent from collection classes
  // to routes and other consumers of the class after an insert/update/delete.

  /**
   * make a uniform response format for insertOne and insertMany
   * @param {MongoInsertResultType} mongoRes
   * @returns {Promise<InsertResponseType>}
   */
  async makeInsertResponse(mongoRes) {
    // retrieve the "@id"s
    const insertedIds = await this.getIiifIdsFromMongoIds(
      // MongoInsertOneResultType and MongoInsertManyResultType have a different structureex
      mongoRes.insertedId || Object.values(mongoRes.insertedIds)
    );
    return makeInsertResponse(insertedIds);
  }

  /**
   * @param {MongoUpdateResultType} mongoRes
   * @returns {Promise<UpdateResponseType>}
   */
  async makeUpdateResponse(mongoRes) {
    if (mongoRes.upsertedId) {
      // only 1 entry can be upserted by a mongo query => extract the 1st upserted @id from the mongo @id.
      const upsertedIds = await this.getIiifIdsFromMongoIds(
        mongoRes.upsertedId
      );
      mongoRes.upsertedId = upsertedIds.length ? upsertedIds[0] : mongoRes.upsertedId;
    }
    return makeUpdateResponse(mongoRes);
  }

  /**
   * throw an error with just the object describing the error data (and not the stack or anything else).
   * used to propagate write errors to routes.
   * @param {DataOperationsType} operation: describes the database operation
   * @param {import("mongodb").MongoServerError} err: the mongo error
   */
  throwMongoError(operation, err) {
    throw this.errorConstructor(operation)(err.message, err.errorResponse);
  }

  //////////////////////////////////////
  // INSERT/UPDATE

  /**
   * insert a single document `doc` into `this.collection`.
   * no validation or checking is done here. obviously, `doc` must fit the JsonSchema defined for `this.collection`.
   * @private
   * @param {object} doc
   * @returns {Promise<InsertResponseType>}
   */
  async insertOne(doc) {
    try {
      const result = await this.collection.insertOne(doc);
      return this.makeInsertResponse(result);
    } catch (err) {
      this.throwMongoError("insert", err);
    }
  }

  /**
   * insert documents from an array of documents.
   * no validation or checking is done here. obviously, documents in `docArr` must fit the JsonSchema defined for `this.collection`.
   * @param {object[]} docArr
   * @returns {Promise<InsertResponseType>}
   */
  async insertMany(docArr) {
    try {
      const result = await this.collection.insertMany(docArr);
      return this.makeInsertResponse(result);
    } catch (err) {
      this.throwMongoError("insert", err);
    }
  }

  /**
   * update a single document, targeted by an unique identifier (should be "@id" for iiif 3, "id" otherwise).
   * @param {object} query: query targeting a document
   * @param {object} update: the updated document.
   * @returns {Promise<UpdateResponseType>}
   */
  async updateOne(query, update){
    try {
      const result = await this.collection.updateOne(query, update);
      return this.makeUpdateResponse(result);
    } catch (err) {
      this.throwMongoError("update", err)
    }
  }

  //////////////////////////////////////
  // DELETE

  /**
   * delete all objects that match `queryObj` from `this.collection`
   * NOTE: if nothing is deleted, it's not an error, we return: { deletedCount: 0 }
   * @param {object} queryObj
   * @returns {Promise<DeleteResponseType>}
   */
  async delete(queryObj) {
    try {
      const deleteResult = await this.collection.deleteMany(queryObj);
      return makeDeleteResponse(deleteResult);
    } catch (err) {
      this.throwMongoError("delete", err);
    }
  }

  //////////////////////////////////////
  // READ

  /**
   * true if `queryObj` matches at least 1 document, false otherwise.
   * @param {object} queryObj
   * @returns {Promise<boolean>}
   */
  async exists(queryObj) {
    const r = await this.collection.countDocuments(queryObj, { limit: 1 });
    return r === 1;
  }

  /**
   * count the number of documents that match `queryObj`.
   * @param {object} queryObj
   * @returns {Promise<number>}
   */
  count(queryObj) {
    return this.collection.countDocuments(queryObj);
  }

}

export default CollectionAbstract;