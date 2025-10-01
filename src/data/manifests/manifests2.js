import fastifyPlugin from "fastify-plugin";

import ManifestsAbstract from "#manifests/manifestsAbstract.js";
import { objectHasKey } from "#data/utils/utils.js";
import { getManifestShortId, getIiifIdsFromMongoIds, manifestUri } from "#data/utils/iiif2Utils.js";
import { makeInsertResponse, makeUpdateResponse, makeDeleteResponse } from "#src/data/utils/responseUtils.js";


/** @typedef {import("#data/types.js"). MongoObjectId} MongoObjectId */
/** @typedef {import("#data/types.js"). MongoInsertResultType} MongoInsertResultType */
/** @typedef {import("#data/types.js"). MongoUpdateResultType} MongoUpdateResultType */
/** @typedef {import("#data/types.js"). MongoDeleteResultType} MongoDeleteResultType */
/** @typedef {import("#data/types.js").InsertResponseType} InsertResponseType */
/** @typedef {import("#data/types.js").UpdateResponseType} UpdateResponseType */
/** @typedef {import("#data/types.js").DeleteResponseType} DeleteResponseType */
/** @typedef {import("#data/types.js").DataOperationsType } DataOperationsType */
/** @typedef {import("#data/types.js").DeleteByType } DeleteByType */
/** @typedef {import("#data/types.js").ManifestType } ManifestType */

class Manifest2Error extends Error {
  /**
   * @param {DataOperationsType} action
   * @param {string} message: error message
   * @param {object?} errInfo: extra data
   */
  constructor(action, message, errInfo) {
    super(`Manifest2Error: error when performing operation ${action.toLocaleLowerCase()}: ${message}`);
    this.info = errInfo;
  }
}


class Manifests2 extends ManifestsAbstract {
  /**
   * @param {import("fastify").FastifyInstance} fastify
   */
  constructor(fastify) {
    super(fastify, 2, {});
  }

  /////////////////////////////////////////////
  // utils

  /**
   * NOTE: this could be done with a JSONSchema.
   * @param {object} manifest
   * @returns {void}
   */
  validateManifest(manifest) {
    if (
      // manifest-level validation
      ! ["@id", "sequences"].every((k) => Object.keys(manifest).includes(k))
      // canvas-level . all necessary keys go in the first array (["@id"].every(...)).
      || ! ["@id"].every((k) =>
        // sequences is an array, but only the 1st element (default sequence) is embedded in the manifest. non-default sequences are not processed here.
        manifest.sequences[0].canvases.every((canvas) =>
          Object.keys(canvas).includes(k)
        )
      )
    ) {
      // throw
      throw new Manifest2Error("insert", "validateManifest: invalid manifest structure", manifest);
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
   * @param {MongoInsertResultType} mongoResponse
   * @returns {InsertResponseType}
   */
  async #makeInsertResponse(mongoResponse) {
    const insertedIds = await getIiifIdsFromMongoIds(
      this.manifestsCollection,
      mongoResponse.insertedId || mongoResponse.insertedIds
    );
    return makeInsertResponse(insertedIds);
  }

  /////////////////////////////////////////////
  // write

  /**
   * write a clean manifest to database
   * @param {ManifestType}
   * @returns {Promise<InsertResponseType>}
   */
  async #insertOne(manifest) {
    const mongoResponse = await this.manifestsCollection.insertOne(manifest);  // todo
    return this.#makeInsertResponse(mongoResponse);
  }

  /**
   * save a single manifest to database.
   * @param {object} manifest: a IIIF manifest
   * @returns {Promise<InsertResponseType>}
   */
  async insertManifest(manifest) {
    try {
      this.validateManifest(manifest);
      manifest = this.#cleanManifest(manifest);

      const mongoResponse = await this.#insertOne(manifest);
      return makeInsertResponse(mongoResponse);
    } catch (err) {
      console.log(err);
      throw new Manifest2Error("insert", `error inserting manifest because of '${err.message}'`, manifest);
    }
  }

  /**
   * insert a manifest from an URI
   * @param {string} manifestUri
   * @returns {Promise<InsertResponseType>}
   */
  async insertManifestFromUri(manifestUri) {
    try {
      const
        r = await fetch(manifestUri),
        manifest = JSON.parse(r.body);
      return this.insertManifest(manifest);
    } catch (err) {
      throw new Manifest2Error("insert", `error fetching manifest with URI '${manifestUri}'`);
    }
  }

  /////////////////////////////////////////////
  // delete


  /////////////////////////////////////////////
  // read


}

export default fastifyPlugin((fastify, options, done) => {
  fastify.decorate("manifests2", new Manifests2(fastify));
  done();
}, {
  name: "manifests2",
})

