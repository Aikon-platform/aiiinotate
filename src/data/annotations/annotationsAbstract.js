/** @typedef {import("mongodb").Db} Db */
/** @typedef {import("#data/types.js").IiifPresentationVersionType} IiifPresentationVersionType */

class AnnotationsAbstract {
  /**
   * NOTE: async constructors are NOT ALLOWED in JS, so be sure that all arguments are passed as resolved objects, NOT AS PROMISES.
   *
   * @param {import("fastify").FastifyInstance} fastify\
   * @param {IiifPresentationVersionType} iiifPresentationVersion
   */
  constructor(fastify, iiifPresentationVersion) {
    const [ annotationsCollectionName, annotationsCollectionOptions ] =
      iiifPresentationVersion === 2
        ? [
          "annotations2",
          { validator: { $jsonSchema: fastify.schemasPresentation2.getSchema("annotation") } }
        ]
        : [
          "annotations3",
          { validator: { /** TODO */ } }
        ];

    this.fastify = fastify;
    this.client = fastify.mongo.client;
    this.db = fastify.mongo.db;
    this.annotationsCollection = this.db.collection(
      annotationsCollectionName,
      annotationsCollectionOptions
    );
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

export default AnnotationsAbstract;
