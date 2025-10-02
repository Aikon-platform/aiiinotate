/** @typedef {import("#types").MongoDbType} MongoDbType */
/** @typedef {import("#types").IiifPresentationVersionType} IiifPresentationVersionType */
/** @typedef {import("#types").CollectionNamesType} CollectionNamesType */
/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */

const allowedCollectionNames = ["manifests2", "manifests3", "annotations2", "annotations3"];
const allowedIiifPresentationVersions = [2,3];

class CollectionAbstractError extends Error {
  constructor(message) {
    super(`CollectionAbstractError: ${message}`);
  }
}

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
      throw new CollectionAbstractError(`invalid 'collectionName': expected one of ${allowedCollectionNames}, got '${collectionName}'`);
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
  }

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

}

export default CollectionAbstract;