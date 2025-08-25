/** @typedef {import("mongodb").Db} Db */

import { mongodb } from "@fastify/mongodb";


class AnnotationsAbstract {
  /**
   * @param {import("mongodb").Db} db
   * @param {import("mongodb").MongoClient} client
   */
  constructor(db, client) {
    this.db = db;
    this.client = client;
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
    return `${this.className}.${func.name}`
  }

  /**
   * generate an error message, with format: className.funcName: errMsg
   * @param {string} func
   * @param {string} msg
   */
  errorMessage(func, msg) {
    throw new Error(`${this.funcName(func)} : ${msg}`);
  }

  async insertOne(annotation) {
    throw new Error("`AnnotationsAbstract.insertOne` is not implemented")
  }

  async insertMany(annotationArray) {
    throw new Error("`AnnotationsAbstract.insertMany` is not implemented")
  }

  async read(filter) {
    throw new Error("`AnnotationsAbstract.read` is not implemented")
  }
}

export default AnnotationsAbstract;
