import fastifyPlugin from "fastify-plugin";

import CollectionAbstract from "#data/collectionAbstract.js";
import { getManifestShortId, manifestUri } from "#utils/iiif2Utils.js";
import { inspectObj, ajv } from "#utils/utils.js";

/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */
/** @typedef {import("#types").MongoObjectId} MongoObjectId */
/** @typedef {import("#types").MongoInsertResultType} MongoInsertResultType */
/** @typedef {import("#types").MongoUpdateResultType} MongoUpdateResultType */
/** @typedef {import("#types").MongoDeleteResultType} MongoDeleteResultType */
/** @typedef {import("#types").InsertResponseType} InsertResponseType */
/** @typedef {import("#types").UpdateResponseType} UpdateResponseType */
/** @typedef {import("#types").DeleteResponseType} DeleteResponseType */
/** @typedef {import("#types").DataOperationsType } DataOperationsType */
/** @typedef {import("#types").DeleteByType } DeleteByType */
/** @typedef {import("#types").ManifestType } ManifestType */

/** @typedef {Manifests2} Manifests2InstanceType */


/**
 * @class
 * @constructor
 * @public
 * @extends {CollectionAbstract}
 */
class Manifests2 extends CollectionAbstract {
  /**
   * @param {FastifyInstanceType} fastify
   */
  constructor(fastify) {
    super(fastify, "manifests2");

    this.validatorManifest = ajv.compile({
      type: "object",
      required: ["@id", "sequences"],
      properties: {
        "@id": { type: "string" },
        sequences: {
          type: "array",
          items: {
            type: "object",
            required: [ "@id", "canvases" ],
            properties: {
              "@id": { type: "string" },
              canvases: {
                type: "array",
                items: {
                  type: "object",
                  required: [ "@id" ],
                  properties: {
                    "@id": { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  /////////////////////////////////////////////
  // utils

  /**
   * NOTE: PERFORMANCE: using AJV validation is MUCH FASTER than doing manual verifications (-25% execution time for the test suite)
   * @param {object} manifest
   * @returns {void}
   */
  #validateManifest(manifest) {
    if ( !this.validatorManifest(manifest) ) {
      throw this.insertError("validateManifest: invalid manifest structure", manifest);
    }
  }

  /**
   * convert a manifest to internal data model
   *
   * NOTE: there is no need to reprocess "@id"s: the whole manifest is not stored in the database, so we need to keep all urls and references to external data intact.
   * NOTE: only the 1st (default) sequence is processed. other optional sequences MUST be referenced from the manifest (not embedded). in practice, they are rare, so we don´t process them.
   * see: https://iiif.io/api/presentation/2.1/#sequence
   *
   * @param {object} manifest
   * @returns {ManifestType}
   */
  #cleanManifest(manifest) {
    return {
      "@id": manifest["@id"],
      manifestShortId: getManifestShortId(manifest["@id"]),
      canvasIds: manifest.sequences[0].canvases.map((canvas) => canvas["@id"])
    };
  }

  /**
   * validation + cleaning pipeline
   * @param {object} manifest
   * @returns {object}
   */
  #validateAndCleanManifest(manifest) {
    this.#validateManifest(manifest);
    return this.#cleanManifest(manifest);
  }

  /**
   * fetch a manifest and return it as an object
   * @param {string} manifestUri
   * @returns
   */
  async #fetchManifestFromUri(manifestUri) {
    try {
      const r = await fetch(manifestUri);
      return await r.json();
    } catch (err) {
      throw this.errorInsert(`error fetching manifest with URI '${manifestUri}'`);
    }
  }

  /////////////////////////////////////////////
  // write

  /**
   * save a single manifest to database.
   * @param {object} manifest - a IIIF manifest
   * @returns {Promise<InsertResponseType>}
   */
  async insertManifest(manifest) {
    manifest = this.#validateAndCleanManifest(manifest);
    return this.insertOne(manifest);
  }

  /**
   * insert several manifests to database
   * if `throwOnError===false`, don't raise if there is an error: instead, insert as many documents as possible.
   * see the docs of `insertManifestsFromUriArray` for more info.
   *
   * @param {object[]} manifestArray - array of manifests
   * @returns {Promise<InsertResponseType>}
   */
  async insertManifestArray(manifestArray, throwOnError=true) {
    // build 2 arrays, one of the manifests that pass validation, one of the @ids of the manifests with errors, mapped to an error message.
    const
      cleanManifestArray = [],
      invalidManifestArray = [];
    manifestArray.map((manifest) => {
      try {
        cleanManifestArray.push(this.#validateAndCleanManifest(manifest));
      } catch (err) {
        if ( throwOnError ) {
          throw err;
        }
        // returns a mapping of `{manifestId: errorMessage}`
        invalidManifestArray.push({ [manifest["@id"]]: err.message });
      }
    });
    const result = await this.insertMany(cleanManifestArray);
    // if there has been an error but error-throwing was disabled, complete the response object with description of the errors
    if ( !throwOnError ) {
      result.rejectedIds = invalidManifestArray;
    }
    return result;
  }

  /**
   * insert a manifest from an URI
   * @param {string} manifestUri
   * @returns {Promise<InsertResponseType>}
   */
  async insertManifestFromUri(manifestUri) {
    try {
      const manifest = await this.#fetchManifestFromUri(manifestUri);
      return this.insertManifest(manifest);
    } catch (err) {
      throw this.errorInsert(`error inserting manifest with URI '${manifestUri}' because of error: ${err.message}`);
    }
  }

  /**
   * from an array of URIs, insert many manifests.
   *
   * if `throwOnError===false`, the function will not throw. instead, it will try to insert as much as possible, and the response will give info on the failure cases.
   * the first use case for this behaviour is to index all manifests related to an array of annotations. given that we reconstruct
   * manifest URIs from canvas URIs manually, there may always be an error. we want to insert a manifest when possible, and return an error othersise.
   *
   * @param {string[]} manifestUriArray
   * @param {boolean} throwOnError
   * @returns {Promise<InsertResponseType>}
   */
  async insertManifestsFromUriArray(manifestUriArray, throwOnError=true) {
    // PERFORMANCE: ~2837 ms
    // return Promise.all(
    //   manifestUriArray.map(async (manifestUri) => {
    //     try {
    //       return await this.insertManifestFromUri(manifestUri)
    //     } catch (err) {
    //       console.error(err);
    //       return { rejectedManifestUri: manifestUri }
    //     }
    //   })
    // )

    // PERFORMANCE ~2850ms
    const
      fetchErrorIds = [],
      manifestArray = [];
    await Promise.all(
      manifestUriArray.map(async (manifestUri) => {
        try {
          manifestArray.push(await this.#fetchManifestFromUri(manifestUri));
        } catch (err) {
          if ( throwOnError ) {
            throw err;
          }
          fetchErrorIds.push(manifestUri);
        }
      })
    );
    const result = await this.insertManifestArray(manifestArray, throwOnError);
    // if there has been an error but error-throwing was disabled, complete the response object with description of the errors
    if ( !throwOnError ) {
      result.fetchErrorIds = fetchErrorIds;
    }
    return result;
  }

  /////////////////////////////////////////////
  // delete


  /////////////////////////////////////////////
  // read

  /**
   * return the position of `canvasUri` within the manifest with ID `manifestUri`,
   * or return `undefined` if the canvas is not found in the manifest, or the manifest is not indexed.
   * @param {string} manifestUri
   * @param {string} canvasUri
   * @returns {Promise<number?>}
   */
  async getCanvasIdx(manifestUri, canvasUri) {
    // NOTE: PERFORMANCE increases using `aggregate` with `$indexOfArray` to find the index of `canvasUri`: up to 30% faster execution of the app's test suite:
    // - with `aggregate`, ~2800ms for the whole test suite to run.
    // - with a native `coll.findOne()` and then getting the canvas ID manually (`arr.indexOf`), ~4000ms for the whole test suite to run.
    // https://www.mongodb.com/docs/manual/aggregation/
    // https://www.mongodb.com/docs/manual/reference/operator/aggregation/indexOfArray/
    /**
     * @type { { _id: MongoObjectId, index: number } | null }
     * if `cursor.next() => null`, no document was found.
     * otherwise the index is returned (-1 if `canvasIdx` was not found in the document)
     */
    const r = await this.collection.aggregate([
      { $match: { "@id": manifestUri } },
      { $project: { index: { $indexOfArray: ["$canvasIds", canvasUri] } } }
    ]).next();
    return r === null
      ? undefined
      : r.index !== -1 ? r.index : undefined;
  }
}

export default fastifyPlugin((fastify, options, done) => {
  fastify.decorate("manifests2", new Manifests2(fastify));
  done();
}, {
  name: "manifests2",
})

