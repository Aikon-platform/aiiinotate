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


/**
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

  /////////////////////////////////////////////
  // write

  /**
   * save a single manifest to database.
   * @param {object} manifest: a IIIF manifest
   * @returns {Promise<InsertResponseType>}
   */
  async insertManifest(manifest) {
    this.#validateManifest(manifest);
    manifest = this.#cleanManifest(manifest);
    return this.insertOne(manifest);
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
        manifest = await r.json();
      return this.insertManifest(manifest);
    } catch (err) {
      throw this.errorInsert(`error fetching manifest with URI '${manifestUri}'`);
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

