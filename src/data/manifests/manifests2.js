import fastifyPlugin from "fastify-plugin";

import CollectionAbstract from "#data/collectionAbstract.js";
import { getManifestShortId } from "#utils/iiif2Utils.js";
import { formatInsertResponse } from "#utils/routeUtils.js";
import { inspectObj, visibleLog, ajvCompile, memoize } from "#utils/utils.js";
import { IIIF_PRESENTATION_2_CONTEXT } from "#utils/iiifUtils.js";
import { PUBLIC_URL } from "#constants";

/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */
/** @typedef {import("#types").MongoObjectId} MongoObjectId */
/** @typedef {import("#types").MongoInsertResultType} MongoInsertResultType */
/** @typedef {import("#types").MongoUpdateResultType} MongoUpdateResultType */
/** @typedef {import("#types").MongoDeleteResultType} MongoDeleteResultType */
/** @typedef {import("#types").InsertResponseType} InsertResponseType */
/** @typedef {import("#types").UpdateResponseType} UpdateResponseType */
/** @typedef {import("#types").DeleteResponseType} DeleteResponseType */
/** @typedef {import("#types").DataOperationsType } DataOperationsType */
/** @typedef {import("#types").AnnotationsDeleteKeyType } AnnotationsDeleteKeyType */
/** @typedef {import("#types").Manifest2InternalType } Manifest2InternalType */
/** @typedef {import("#types").AjvValidateFunctionType} AjvValidateFunctionType */
/** @typedef {import("#types").IiifCollection2Type} IiifCollection2Type */

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

    /** @type {AjvValidateFunctionType} */
    this.validatorManifest = ajvCompile(fastify.schemasResolver(
      fastify.schemasPresentation2.getSchema("manifestPublic")
    ));
  }

  /////////////////////////////////////////////
  // utils

  /**
   * fetch the array of canvasIds for a single manifest.
   * since, in AIKON after a RegionExtraction, an annotation insert
   * is done once per canvas, and for each annotation insert, we
   * fetch the canvas index, we memoize the canvas list for each manifest URI
   * to avoid multiplying database calls.
   * @type {(string) => Promise<string[]>}
   */
  #memoizeGetManifestCanvasIds = memoize(async (manifestUri) => {
    const doc = await this.collection
      .findOne(
        { "@id": manifestUri },
        { projection: { canvasIds: 1, _id: 0 } }  // findOne is enough, there's only one manifest per URI
      );
    return doc?.canvasIds ?? [];
  }, 60_000);

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
   * @returns {Manifest2InternalType}
   */
  #cleanManifest(manifest) {
    return {
      "@id": manifest["@id"],
      "@type": "sc:Manifest",
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
      throw this.insertError(`error fetching manifest with URI '${manifestUri}'`);
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
    const manifestExists = await this.exists({ "@id": manifest["@id"] });
    if ( !manifestExists ) {
      return this.insertOne(manifest);
    } else {
      return formatInsertResponse({ preExistingIds: [manifest["@id"]] });
    }
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
    let
      cleanManifestArray = [],
      invalidManifestArray = [],
      preExistingIds = [];
    manifestArray.map((manifest) => {
      try {
        cleanManifestArray.push(this.#validateAndCleanManifest(manifest));
      } catch (err) {
        if ( throwOnError ) {
          throw err;
        }
        // returns a mapping of `{manifestUri: errorMessage}`
        invalidManifestArray.push({ [manifest["@id"]]: err.message });
      }
    });

    // filter out the manifests that are aldready in our collection
    // NOTE: i have attempted to move this to `insertManifestsFromUriArray` but it leads to what I suspect is a data race causing unique constaints fails.
    //  TLDR: don't move or disable this check.
    let cleanIds = cleanManifestArray.map((manifest) => manifest["@id"]);
    [cleanIds, preExistingIds] = await this.#filterManifestIdsInCollection(cleanIds);

    // remove pre-inserted IDs of manifests from cleanManifestArray
    cleanManifestArray = cleanManifestArray.filter((manifest) => cleanIds.includes(manifest["@id"]));

    // insert. if there has been an error but throwOnError === "false", complete the response object with description of the errors
    // no need for try..except, no errors should happen here.
    if ( cleanManifestArray.length ) {
      const result = await this.insertMany(cleanManifestArray);
      result.preExistingIds = preExistingIds;
      result.rejectedIds = invalidManifestArray;
      return result;

    } else {
      return formatInsertResponse({
        preExistingIds: preExistingIds,
        rejectedIds: invalidManifestArray
      });
    }
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
      throw this.insertError(`error inserting manifest with URI '${manifestUri}' because of error: ${err.message}`);
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
    // PERFORMANCE ~2850ms
    const
      fetchErrorIds = [],
      manifestArray = [];

    // fetch the manifests. if there's a fetch error, they won't be inserted.
    await Promise.all(
      manifestUriArray.map(async (manifestUri) => {
        try {
          const r = await this.#fetchManifestFromUri(manifestUri);
          if ( ! r.error ) {
            manifestArray.push(r);
          } else {
            fetchErrorIds.push(manifestUri);
          }
        } catch (err) {
          if ( throwOnError ) {
            throw err;
          }
          fetchErrorIds.push(manifestUri);
        }
      })
    );

    if ( fetchErrorIds.length ){
      const errMsg = `error inserting ${fetchErrorIds.length} manifests: ${fetchErrorIds}`
      if ( throwOnError ) {
        throw this.insertError(errMsg)
      } else if ( fetchErrorIds.length ) {
        this.fastify.log.error(errMsg, fetchErrorIds);
      }
    }

    // insert and format response
    const result = await this.insertManifestArray(manifestArray, throwOnError, true);
    result.fetchErrorIds = fetchErrorIds;
    return result;
  }

  /////////////////////////////////////////////
  // delete

  /**
   * @param {"manifestShortId"|"uri"} deleteKey = what deleteId describes: a manifest URI or its short ID
   * @param {string} deleteVal - data to delete
   * @returns {Promise<DeleteResponseType>}
   */
  // NOTE: could be refactored with `annotations2.delete`: both functions are the same, only the filter changes
  async deleteManifest(deleteKey, deleteVal) {
    const allowedDeleteKey = ["uri", "manifestShortId"];
    if ( !allowedDeleteKey.includes(deleteKey) ) {
      throw this.deleteError(`${this.funcName(this.deleteManifest)}: expected one of ${allowedDeleteKey}, got '${deleteKey}'`);
    }

    const deleteFilter =
      deleteKey==="uri"
        ? { "@id": deleteVal }
        : { manifestShortId: deleteVal };

    return this.delete(deleteFilter);
  }

  /////////////////////////////////////////////
  // read

  /**
   * find which manifests in an array of manifest IDs are aldready in the manifests collection
   * @param {string[]} manifestUriArray - array of manifest IDs
   * @returns {Promise<Array<Array<string?>>>} 2 arrays:
   *  - array of manifest IDs that are not aldready in this collection
   *  - array of manifest IDs that are not in this collection
   */
  async #filterManifestIdsInCollection(manifestUriArray) {
    const
      preExistingIds = [],
      toInsertIds = [];
    // all manifest IDs from manifestUriArray that are aldready in our manifest collection
    const inCollectionArray = (
      await this.collection.find(
        { "@id": { $in: manifestUriArray } },
        { projection: { "@id": 1 } }
      ).toArray()
    ).map((r) => r["@id"]);
    // split manifestUriArray in 2 lists.
    manifestUriArray.map((manifestUri) =>
      inCollectionArray.includes(manifestUri)
        ? preExistingIds.push(manifestUri)
        : toInsertIds.push(manifestUri)
    );
    return [toInsertIds, preExistingIds];
  }

  /**
   * return the position of `canvasUri` within the manifest with ID `manifestUri`,
   * or return `undefined` if the canvas is not found in the manifest, or the manifest is not indexed.
   * @param {string} manifestUri
   * @param {string} canvasUri
   * @returns {Promise<number?>}
   */
  async getCanvasIdx(manifestUri, canvasUri) {
    // old method without memoization.
    // - with `aggregate`, ~2800ms for the whole test suite to run.
    // - with a native `coll.findOne()` and then getting the canvas ID manually (`arr.indexOf`), ~4000ms for the whole test suite to run.
    // https://www.mongodb.com/docs/manual/aggregation/
    // https://www.mongodb.com/docs/manual/reference/operator/aggregation/indexOfArray/
    // const r = await this.collection.aggregate([
    //   { $match: { "@id": manifestUri } },
    //   { $project: { index: { $indexOfArray: ["$canvasIds", canvasUri] } } }
    // ]).next();
    const r = await this.#memoizeGetManifestCanvasIds(manifestUri);
    const index = r.indexOf(canvasUri);
    return index !== -1 ? index : undefined
  }

  /**
   * return a collection of all manifests in the database.
   * @returns {Promise<IiifCollection2Type>}
   */
  async getManifests() {

    const manifestIndex = await this.collection.find(
      {},
      { projection: { "@id": 1, "@type": 1, _id: 0 } }
    ).toArray();
    return {
      ...IIIF_PRESENTATION_2_CONTEXT,
      "@type": "sc:Collection",
      "@id": `${PUBLIC_URL}/manifests/2`,
      label: "Collection of all manifests indexed in the annotation server",
      members: manifestIndex
    }
  }

  /**
   * @param {string} manifestShortId
   * @returns {object}
   */
  async findByManifestShortId(manifestShortId) {
    try {
      const manifestIndexArray = await this.collection
        .find(
          { manifestShortId: manifestShortId },
          { limit: 1, project: {_id: 0} }
        )
        .limit(1);
      return manifestIndexArray.length ? manifestIndexArray[1] : {}
    } catch (err) {
      throw this.readError(`${this.funcName(this.findByManifestShortId)}: error fetching manifest with manifestShortId: '${manifestShortId}'`)
    }
  }
}

export default fastifyPlugin((fastify, options, done) => {
  fastify.decorate("manifests2", new Manifests2(fastify));
  done();
}, {
  name: "manifests2",
})

