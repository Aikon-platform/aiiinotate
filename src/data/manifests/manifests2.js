import fastifyPlugin from "fastify-plugin";

import ManifestsAbstract from "#manifests/manifestsAbstract.js";
import { getManifestShortId, getIiifIdsFromMongoIds } from "#data/utils/iiif2Utils.js";
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

  // TODO: check it's the proper stucture + add extra checks if necessary
  /**
   *
   * @param {object} manifest
   * @returns {void}
   */
  validateManifest(manifest) {
    if (
      // manifest-level validation
      ! ["@id", "sequences"].every((k) => Object.keys(manifest).includes(k))
      // canvas-level validation
      || ! ["@id"].every((k) =>
        manifest.sequences.every((sequence) =>
          (sequence).every((canvas) =>
            Object.keys(canvas).includes(k)
          )
        )
      )
    ) {
      // throw
      console.log()
    }
  }

  #cleanManifest(manifest) {
    //TODO:
    //  1. generate an @id using `getManifestShortId`
    //  2. extract the @ids of all canvas, and preprocess them as well.
    //  3. so, write an `makeCanvasId` function.

  }

  async #makeInsertResponse(mongoResponse) {
    const insertedIds = await getIiifIdsFromMongoIds(
      mongoResponse.insertedId || mongoResponse.insertedIds
    );
    return makeInsertResponse(insertedIds);
  }

  /////////////////////////////////////////////
  // write

  // gets a json manifest, saves it as { @id: string, canvasIds: string[]  }
  #insertOne() {
    const mongoResponse = {};  // todo

    return this.#makeInsertResponse(mongoResponse);
  }

  // fetch manifest, save it, return its "@id"
  async insertManifest(manifestUri) {
    try {
      const r = await fetch(manifestUri);

      let manifest = JSON.parse(r.body);
      this.validateManifest(manifest);
      manifest = this.#cleanManifest(manifest);

      const mongoResponse = await this.#insertOne(manifest);
      return makeInsertResponse(mongoResponse);

    } catch (err) {
      console.log(err);
    }

  }


}

export default fastifyPlugin((fastify, options, done) => {
  fastify.decorate("manifests2", new Manifests2(fastify));
  done();
}, {
  name: "manifests2",
})

