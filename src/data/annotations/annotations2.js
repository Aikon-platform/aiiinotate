/**
 * IIIF presentation 2.1 annotation internals: convert incoming data, interct with the database, return data.
 * exposes an `Annnotations2` class that should contain everything you need
 */
import fastifyPlugin from "fastify-plugin";

import AnnotationsAbstract from "#annotations/annotationsAbstract.js";
import { IIIF_PRESENTATION_2_CONTEXT } from "#data/utils/iiifUtils.js";
import { objectHasKey, isNullish, maybeToArray, inspectObj } from "#data/utils/utils.js";
import { getManifestShortId, makeTarget, makeAnnotationId, toAnnotationList } from "#data/utils/iiif2Utils.js";

// RECOMMENDED URI PATTERNS https://iiif.io/api/presentation/2.1/#a-summary-of-recommended-uri-patterns
//
// Collection 	             {scheme}://{host}/{prefix}/collection/{name}
// Manifest 	               {scheme}://{host}/{prefix}/{identifier}/manifest
// Sequence 	               {scheme}://{host}/{prefix}/{identifier}/sequence/{name}
// Canvas 	                 {scheme}://{host}/{prefix}/{identifier}/canvas/{name}
// Annotation (incl images)  {scheme}://{host}/{prefix}/{identifier}/annotation/{name}
// AnnotationList            {scheme}://{host}/{prefix}/{identifier}/list/{name}
// Range 	                   {scheme}://{host}/{prefix}/{identifier}/range/{name}
// Layer 	                   {scheme}://{host}/{prefix}/{identifier}/layer/{name}
// Content 	                 {scheme}://{host}/{prefix}/{identifier}/res/{name}.{format}

/** @typedef {import("mongodb").ObjectId } MongoObjectId */
/** @typedef {import("mongodb").InsertManyResult} InsertManyResultType */
/** @typedef {import("mongodb").InsertOneResult} InsertOneResultType */
/** @typedef {import("mongodb").UpdateResult} UpdateResultType */
/** @typedef {import("#data/types.js").InsertResponseType} InsertResponseType */
/** @typedef {import("#data/types.js").UpdateResponseType} UpdateResponseType */
/** @typedef {import("#data/types.js").DeleteResponseType} DeleteResponseType */
/** @typedef {import("#data/types.js").DataOperationsType } DataOperationsType */
/** @typedef {import("#data/types.js").DeleteByType } DeleteByType */

class Annotations2Error extends Error {
  /**
   * @param {MongoOperations} action
   * @param {string} message: error message
   * @param {object?} errInfo: extra data
   */
  constructor(action, message, errInfo) {
    super(`Annotations2Error: error when performing operation ${action.toLocaleLowerCase()}: ${message}`);
    this.info = errInfo;
  }
}

/**
 * @extends {AnnotationsAbstract}
 */
class Annnotations2 extends AnnotationsAbstract {

  /**
   * @param {import("fastify").FastifyInstance} fastify
   */
  constructor(fastify) {
    super(fastify, 2);
  }

  ////////////////////////////////////////////////////////////////
  // utils

  /**
   * clean an annotation before saving it to database.
   * some of the work consists of translating what is defined by the OpenAnnotations standard to what is actually used by IIIF annotations.
   * if `update`, some cleaning will be skipped (especially the redefinition of "@id"), otherwise updates would fail.
   *
   * @param {object} annotation
   * @param {boolean} update: set to `true` if performing an update instead of an insert.
   * @returns {object}
   */
  #cleanAnnotation(annotation, update=false) {
    // 1) extract ids and targets
    const
      annotationTarget = makeTarget(annotation),
      manifestShortId = getManifestShortId(annotationTarget.full);

    // in updates, "@id" has aldready been extracted
    if ( !update ) {
      annotation["@id"] = makeAnnotationId(annotation, manifestShortId);
    }
    annotation["@context"] = IIIF_PRESENTATION_2_CONTEXT["@context"];
    annotation.on = annotationTarget;
    annotation.on.manifestShortId = manifestShortId;

    // 2) process motivations.
    // - motivations are an array of strings
    // - open annotation specifies that motivations should be described by the `oa:Motivation`, while IIIF 2.1 examples uses the `motivation` field => uniformizwe
    // - all values must be `sc:painting` or prefixed by `oa:`: IIIF presentation API indicates that the only allowed values are open annotation values (prefixed by `oa:`) or `sc:painting`.
    if ( objectHasKey(annotation, "oa:Motivation") ) {
      annotation.motivation = annotation["oa:Motivation"];
      delete annotation["oa:motivation"];
    }
    annotation.motivation =
      maybeToArray(annotation.motivation || [])
        .map(String)
        .map((motiv) =>
          motiv.startsWith("oa:") || motiv.startsWith("sc:")
            ? motiv
            : `oa:${motiv}`
        );

    const resource = annotation.resource || undefined;
    if ( resource ) {
      // 3) uniformize embedded textual body keys
      // OA allows `cnt:ContentAsText` or `dctypes:Text` for Embedded Textual Bodies, IIIF only uses `dctypes:Text`
      resource["@type"] =
        resource["@type"] === "cnt:ContentAsText"
          ? "dctypes:Text"
          : resource["@type"];
      // OA stores Textual Body content in `cnt:chars`, IIIF uses `chars`. `value` is sometimes also used
      resource.chars = resource.value || resource["cnt:chars"] || resource.chars;  // may be undefined

      [ "value", "cnt:chars" ].map((k) => {
        if ( Object.keys(resource).includes(k) ) {
          delete resource[k];
        }
      })

      // 4) delete body if it's empty. a body is empty if
      //  - it's got no `@id` and
      //  - it's not an Embedded Textual Body, or it's an empty Embedded Textual Body.
      // see: https://github.com/Aikon-platform/aiiinotate/blob/dev/docs/specifications/0_w3c_open_annotations.md#embedded-textual-body-etb
      const
        hasTextualBody = objectHasKey(resource, "chars"),
        emptyBody = isNullish(resource.chars) || resource.chars === "<p></p>";

      if ( isNullish(resource["@id"]) && (emptyBody || !hasTextualBody) ) {
        delete(annotation.resource);
      }
    }

    return annotation;
  }

  /**
   * take an annotationList, clean it and return it as a array of annotations.
   * see: https://iiif.io/api/presentation/2.1/#annotation-list
   * @param {object} annotationList
   * @returns {object[]}
   */
  #cleanAnnotationList(annotationList) {
    if (
      annotationList["@type"] !== "sc:AnnotationList"
      || !objectHasKey(annotationList, "@id")
      || !Array.isArray(annotationList.resources)
    ) {
      this.errorMessage(this.#cleanAnnotationList, `could not recognize AnnotationList. see: https://iiif.io/api/presentation/2.1/#annotation-list. received: ${annotationList}`)
    }
    //NOTE: using an arrow function is necessary to avoid losing the scope of `this`.
    // otherwise, `this` is undefined in `#cleanAnnotation`.
    return annotationList.resources.map((ressource) => this.#cleanAnnotation(ressource))
  }

  /**
   * make a uniform response format for #insertOne and #insertMany
   * @param {InsertManyResultType | InsertOneResultType} mongoRes
   * @returns {Promise<InsertResponseType>}
   */
  async #makeInsertResponse(mongoRes) {
    // retrieve the "@id"s
    const insertedIds = await this.#annotationIdFromMongoId(
      mongoRes.insertedId || Object.values(mongoRes.insertedIds)
    );
    // mongoRes is `InsertOneResult`
    if ( objectHasKey(mongoRes, "insertedId") ) {
      return {
        insertedCount: 1,
        insertedIds: insertedIds
      }
    // mongoRes is `insertManyResult`
    } else if ( objectHasKey(mongoRes, "insertedIds") ) {
      return {
        insertedCount: mongoRes.insertedCount,
        insertedIds: insertedIds
      }
    } else {
      throw new Annotations2Error("insert", "unrecognized mongo response: expected one of 'InsertManyResult' or 'InsertOneResult'", mongoRes)
    }
  }

  /**
   * @param {UpdateResultType} mongoRes
   * @returns {UpdateResponseType}
   */
  #makeUpdateResponse(mongoRes) {
    return {
      matchedCount: mongoRes.matchedCount,
      modifiedCount: mongoRes.modifiedCount,
      upsertedCount: mongoRes.upsertedCount,
      upsertedId: mongoRes.upsertedId
    };
  }

  /**
   * throw an error with just the object describing the error data (and not the stack or anything else).
   * used to propagate write errors to routes.
   * @param {MongoOperations} operation: describes the database operation
   * @param {import("mongodb").MongoServerError} err: the mongo error
   */
  #throwMongoError(operation, err) {
    throw new Annotations2Error(operation, err.message, err.errorResponse)
  }

  ////////////////////////////////////////////////////////////////
  // insert / updates

  /**
   * insert a single annotation
   * @private
   * @param {object} annotation
   * @returns {Promise<InsertResponseType>}
   */
  async #insertOne(annotation) {
    try {
      const result = await this.annotationsCollection.insertOne(annotation);
      return this.#makeInsertResponse(result);
    } catch (err) {
      this.#throwMongoError("insert", err);
    }
  }

  /**
   * insert annotations from an array of annotations
   * @private
   * @param {object[]} annotationArray
   * @returns {Promise<InsertResponseType>}
   */
  async #insertMany(annotationArray) {
    try {
      const result = await this.annotationsCollection.insertMany(annotationArray);
      return this.#makeInsertResponse(result);
    } catch (err) {
      this.#throwMongoError("insert", err);
    }
  }

  /**
   * update a single annotation, targeted by its "@id"
   * @param {object} annotation
   * @returns {Promise<UpdateResponseType>}
   */
  async #updateOne(annotation){
    try {
      const
        query = { "@id": annotation["@id"] },
        update = { $set: annotation },
        result = await this.annotationsCollection.updateOne(query, update);
      return this.#makeUpdateResponse(result);
    } catch (err) {annotation["@id"]
      this.#throwMongoError("update", err)
    }
  }

  /**
   * validate and insert a single annotation.
   * @param {object} annotationArray
   * @returns {Promise<InsertResponseType>}
   */
  async insertAnnotation(annotation) {
    annotation = this.#cleanAnnotation(annotation);
    return this.#insertOne(annotation);
  }

  /**
   * @param {object} annotation
   * @returns {Promise<UpdateResponseType}
   */
  async updateAnnotation(annotation) {
    // necessary: on insert, the `@id` received is modified by `this.#cleanAnnotationList`.
    annotation = this.#cleanAnnotation(annotation, true);
    return this.#updateOne(annotation);
  }

  /**
   * validate and insert annotations from an annotation list.
   * @param {object} annotationList
   * @returns {Promise<InsertResponseType>}
   */
  async insertAnnotationList(annotationList) {
    const annotationArray = this.#cleanAnnotationList(annotationList);
    return this.#insertMany(annotationArray);
  }

  ////////////////////////////////////////////////////////////////
  // delete

  /**
   * @param {object} queryObj
   * @returns {Promise<DeleteResponseType>}
   */
  async #delete(queryObj) {
    try {
      //NOTE: should we raise if nothing is deleted ? currently, we will only return { deletedCount: 0 }
      const deleteResult = await this.annotationsCollection.deleteMany(queryObj);
      return { deletedCount: deleteResult.deletedCount };
    } catch (err) {
      this.#throwMongoError("delete", err);
    }
  }

  /**
   * @param {string} deleteId
   * @param {Promise<DeleteByType>} deleteBy
   */
  async deleteAnnotations(deleteId, deleteBy) {

    const allowedDeleteBy = [ "uri", "manifestShortId", "canvasUri" ];
    if ( !allowedDeleteBy.includes(deleteBy) ) {
      throw new Annotations2Error("delete", `${this.funcName(this.deleteAnnotations)}: expected one of ${allowedDeleteBy} for param 'deleteBy', got '${deleteBy}'`)
    }

    const deleteFilter =
      deleteBy==="uri"
        ? { "@id": deleteId }
        : deleteBy==="canvasUri"
          ? { "on.full": deleteId }
          : { "on.manifestShortId": deleteId };

    return this.#delete(deleteFilter);
  }

  ////////////////////////////////////////////////////////////////
  // get

  /**
   * true if `queryObj` matches at least 1 annotation, false otherwise.
   * @param {object} queryObj
   * @returns {Promise<boolean>}
   */
  async exists(queryObj) {
    const r = await this.annotationsCollection.countDocuments(queryObj, { limit: 1 });
    return r === 1;
  }

  /**
   * find documents based on a `queryObj` and project them to `projectionObj`.
   *
   * about projection: 0 removes the fields from the response, 1 incldes it (but exclude all others)
   * see: https://www.mongodb.com/docs/drivers/node/current/crud/query/project/#std-label-node-project
   *      https://stackoverflow.com/questions/74447979/mongoservererror-cannot-do-exclusion-on-field-date-in-inclusion-projection
   * @param {object} queryObj
   * @param {object?} projectionObj: extra projection fields to tailor the reponse format
   * @returns {Promise<object[]>}
   */
  async find(queryObj, projectionObj) {
    // 1. construct the final projection object, knowing that we can't mix exclusive and inclusive projectin.
    // presence of `_id` will not cause projections to fail => remove it from values.
    const projectionValues =
      Object.entries(projectionObj)
        .filter(([k,v]) => k !== "_id")
        .map(([k,v]) => v);

    if ( projectionValues.find((x) => ![0,1].includes(x)) ) {
      throw new Annotations2Error("read", `Annotations2.find: only allowed values for projection are 0 and 1. got: ${[...new Set(projectionValues)]}`)
    }
    const distinctProjectionValues = [...new Set(projectionValues)]
    if ( distinctProjectionValues.length !== 1 ) {
      throw new Annotations2Error("read", `Annotations2.find: can't mix insertion and exclusion projection in 'projectionObj'. all values must be either 0 or 1. got: ${distinctProjectionValues}`, projectionObj)
    }
    // negative projection: all fields will be included except for those specified.
    // in this case, negate other fields that we don't ant exposed.
    // in case of positive projection, no specific processing is required: only the explicitly required fields are included.
    // in all cases, `_id` should not be included unless we explicitly ask for it.
    projectionObj._id = projectionObj._id || 0;
    if ( distinctProjectionValues[0] === 0 ) {
      projectionObj["on.manifestShortId"] = projectionObj["on.manifestShortId"] || 0;
    }

    // 2. find, project and return
    return this.annotationsCollection
      .find(queryObj, { projection: projectionObj })
      .toArray();
  }

  /**
   * from an array of Mongo "_id", return the corresponding "@id" fields
   * @param {MongoObjectId | MongoObjectId[]} mongoIds
   * @returns {Promise<string[]>}
   */
  async #annotationIdFromMongoId(mongoIds) {
    mongoIds = maybeToArray(mongoIds);
    const annotationIds = await this.find(
      { _id: { $in: mongoIds } },
      { "@id": 1 }
    )
    return annotationIds.map(a => a["@id"]);
  }

  /**
   * implementation of the IIIF Search API 1.0
   *
   * NOTE:
   *  - only `motivation` and `q` search params are implemented
   *  - to increase search execution, ONLY EXACT STRING MACHES are
   *    implemented for `q` and `motivation` (in the IIIF specs, you can supply
   *    multiple space-separated values and the server should return all partial
   *    matches to any of those strings.)
   *
   * see:
   *  https://iiif.io/api/search/1.0/
   *  https://github.com/Aikon-platform/aiiinotate/blob/dev/docs/specifications/4_search_api.md
   *
   * @param {string} queryUrl
   * @param {string} manifestShortId
   * @param {string} q
   * @param {"painting"|"non-painting"|"commenting"|"describing"|"tagging"|"linking"} motivation
   * @returns {object} annotationList containing results
   */
  async search(queryUrl, manifestShortId, q, motivation) {
    // TODO: update inserts so that our data format is more strict, for easier searches:
    //  - motivations:
    //    - "motivation" key is always named "motivation", not "oa:Motivation"
    //    - "motivation" is always an array of `oa:...` fields.
    //  - embedded textual bodies:
    //    - existnce of an ETB is specified by "resource.@type = "dctypes:Text":string,
    //    - "resource.chars" always contains the string content.

    const
      queryBase = { "on.manifestShortId": manifestShortId },
      queryFilters = { $and: [] };

    // expand query parameters
    if ( q ) {
      queryFilters.$and.push({
        $or: [
          { "@id": q },
          { "resource.@id": q },
          { "resource.chars": q }
        ]
      });
    }
    if ( motivation ) {
      queryFilters.$and.push(
        motivation === "non-painting"
          ? { motivation: { $ne: "sc:painting" } }
          : motivation === "painting"
            ? { motivation: "sc:painting" }
            : { motivation: `oa:${motivation}` }
      );
    }
    const query =
      queryFilters.$and.length
        ? { ...queryBase, ...queryFilters }
        : queryBase;

    const annotations = await this.find(query);
    return toAnnotationList(annotations, queryUrl, `search results for query ${queryUrl}`);
  }

  /**
   * @param {string} canvasUri
   * @param {boolean} asAnnotationList
   * @returns
   */
  async findFromCanvasUri(queryUrl, canvasUri, asAnnotationList=false) {
    const annotations = await this.find({
      "on.full": canvasUri
    });
    return asAnnotationList
      ? toAnnotationList(annotations, queryUrl, `annotations targeting canvas ${canvasUri}`)
      : annotations;
  }

}

export default fastifyPlugin((fastify, options, done) => {
  fastify.decorate("annotations2", new Annnotations2(fastify));
  done();
}, {
  name: "annotations2",
  dependencies: ["manifests2"]
})