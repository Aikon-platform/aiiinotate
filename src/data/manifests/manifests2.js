import fastifyPlugin from "fastify-plugin";

import CollectionAbstract from "#data/collectionAbstract.js";
import { getManifestShortId, manifestUri } from "#utils/iiif2Utils.js";

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
  }

  /////////////////////////////////////////////
  // utils

  /**
   * NOTE: this could be done with a JSONSchema IF AND ONLY IF the manifest is sent directly through a fastify route. however, we also fetch manifests referenced in annotations.
   * @param {object} manifest
   * @returns {void}
   */
  #validateManifest(manifest) {
    if (
      // manifest-level validation
      !["@id", "sequences"].every((k) => Object.keys(manifest).includes(k))
      // canvas-level . all necessary keys go in the first array (["@id"].every(...)).
      || !["@id"].every((k) =>
        // sequences is an array, but only the 1st element (default sequence) is embedded in the manifest. non-default sequences are not processed here.
        manifest.sequences[0].canvases.every((canvas) =>
          Object.keys(canvas).includes(k)
        )
      )
    ) {
      // throw
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
   * @param {object[]} manifestArray - array of manifests
   */
  async insertManifestArray(manifestArray) {
    // TODO: error handling. here, function will return if 1 manifest isn't valid.
    // which contradicts concurrent insertion behaviour defined in `this.insertManifestsFromUriArray`
    manifestArray = manifestArray.map((manifest) => this.#validateAndCleanManifest(manifest));
    return this.insertMany(manifestArray);
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
   * NOTE: this function doesn't throw.
   * the goal is to offer a uniform interface to insert many manifests with promise concurrency. so, we try to insert everything,
   * and when it fails on some of the promises, return success objects where there are successes, failures otherwise.
   * the first use case for this function is to index all manifests related to an array of annotations. given that we reconstruct
   * manifest URIs from canvas URIs manually, there may always be an error. we want to insert a manifest when possible, and return an error othersise.
   * @param {string[]} manifestUriArray
   * @returns {Promise<InsertResponseType>}
   */
  async insertManifestsFromUriArray(manifestUriArray) {
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
      fetchErrors = [],
      manifestArray = [];
    await Promise.all(
      manifestUriArray.map(async (manifestUri) => {
        try {
          manifestArray.push(await this.#fetchManifestFromUri(manifestUri));
        } catch (err) {
          console.error(err);
          fetchErrors.push({ rejectedManifestUri: manifestUri });
        }
      })
    );
    // TODO: return both `insertedManifestIds` and `fetchErrors`, and homogeneise the insertMany across collections.
    // TLDR: here, we need to return 1) the inserted IDs, 2) the IDs of the manifests that could not be fetched in `this.#fetchManifest` or validated by `this.validateManifest`.
    // there should be no need to change the behaviour of `collectionsAbstract.insertMany`, which always succeeds if our validation functions have succeeded.
    // BUT: i need to be sure that ALL `insertMany` functions work the same accross collections and offer a uniform interface.
    // (quitte à faire des insertMany différentes par collection).
    //
    // la solution pourrait être de découpler les fonctions de validations des fonctions d'insertion: si la validation fail sur 1 item, alors on dit qu'on inserera pas celui là
    // mais qu'on insèrera les autres. et à la fin on retourne les @id des insertions et des manifestes qui n'ont pas passé la validation.

    // TODO: le reste:
    // 1) ajouter `canvasIdx` et `manifestUri` aux JsonSchemas.
    // 2) faire une Unique clause sur `manifests2.@id`, puisque cet @id là n'est pas changé.

    // NOTE: pour le moment, on ne retourne que les @ids des manifestes pour lesquels l'insertion a réussi.
    const result = await this.insertManifestArray(manifestArray);
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

