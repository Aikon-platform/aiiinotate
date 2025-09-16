/**
 * IIIF presentation 2.1 annotation internals: convert incoming data, interct with the database, return data.
 * exposes an `Annnotations2` class that should contain everything you need
 */
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

/**
 * @typedef {import("#data/types.js").InsertResponseType} InsertResponseType
 */

class Annotations2ReadError extends Error {
  constructor(mongoMessage, errInfo) {
    super(`Annotations2ReadError: Mongo error when reading data: ${mongoMessage}`);
    this.info = errInfo;
  }
}

class Annotations2InsertError extends Error {
  constructor(message, errInfo) {
    super(`Annotations2InsertError: error when inserting data: ${message}`);
    this.info = errInfo;
  }
}

/**
 * @extends {AnnotationsAbstract}
 */
class Annnotations2 extends AnnotationsAbstract {

  /**
   * @param {import("fastify").FastifyInstance} fastify
   * @param {import("mongodb").MongoClient} client
   * @param {import("mongodb").Db} db
   */
  constructor(fastify, client, db) {

    const
      schemaAnnotation2 = fastify.schemasPresentation2.getSchemaByUri("annotation"),
      collectionOptions = {
        validator: { $jsonSchema: schemaAnnotation2 }
      };
    super(client, db, "annotations2", collectionOptions);
  }

  ////////////////////////////////////////////////////////////////
  // utils

  /**
   * clean an annotation before saving it to database.
   * some of the work consists of translating what is defined by the OpenAnnotations standard to what is actually used by IIIF annotations.
   *
   * @param {object} annotation
   * @returns {object}
   */
  #cleanAnnotation(annotation) {
    // 1) extract ids and targets
    const
      annotationTarget = makeTarget(annotation),
      manifestShortId = getManifestShortId(annotationTarget.full);

    annotation["@id"] = makeAnnotationId(annotation, manifestShortId);
    annotation["@context"] = IIIF_PRESENTATION_2_CONTEXT["@context"];
    annotation.on = annotationTarget;
    annotation.on.manifestShortId = manifestShortId;

    // 2) process motivations.
    // - motivations are an array of strings
    // - open annotation specifies that motivations should be described by the `oa:Motivation`, while IIIF 2.1 examples uses the `motivation` field => uniformizwe
    // - all values must be `sc:painting` or prefixed by `oa:`: IIIF presentation API indicates that the only allowed values are open annotation values (prefixed by `oa:`) or `sc:painting`.
    if ( annotation["oa:Motivation"] ) {
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
      // OA stores Textual Body content in `cnt:chars`, IIIF uses `chars`
      resource.chars = resource["cnt:chars"] || resource.chars;  // may be undefined

      // 4) delete body if it's empty. a body is empty if
      //  - it's got no `@id` and
      //  - it's not an Embedded Textual Body, or it's an empty Embedded Textual Body.
      // see: https://github.com/Aikon-platform/aiiinotate/blob/dev/docs/specifications/0_w3c_open_annotations.md#embedded-textual-body-etb
      const
        hasTextualBody = objectHasKey(resource, "chars"),
        emptyBody = isNullish(resource.chars) || resource.chars === "<p></p>";

      if ( isNullish(resource["@id"]) && (!hasTextualBody || emptyBody) ) {
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
   * throw an error with just the object describing the error data (and not the stack or anything else).
   * used to propagate write errors to routes.
   * @param {import("mongodb").MongoServerError} err: the mongo error
   * @param {"read"|"insert"} op: describes the database operation: is it a read or insert error
   */
  #throwMongoError(op, err) {
    const errObj =
      op === "insert"
        ? new Annotations2InsertError(err.message, err.errorResponse)
        : new Annotations2ReadError(err.message, err.errorResponse);
    throw errObj;
  }

  /**
   * make a uniform response format for #insertOne and #insertMany
   * @param {import("mongodb").InsertManyResult | import("mongodb").InsertOneResult} mongoRes
   * @returns {InsertResponseType}
   */
  #makeInsertResponse(mongoRes) {
    // mongoRes is `InsertOneResult`
    if ( objectHasKey(mongoRes, "insertedId") ) {
      return {
        insertedCount: 1,
        insertedIds: [ mongoRes.insertedId ]
      }
    // mongoRes is `insertManyResult`
    } else if ( objectHasKey(mongoRes, "insertedIds") ) {
      return {
        insertedCount: mongoRes.insertedCount,
        insertedIds: Object.values(mongoRes.insertedIds)
      }
    } else {
      throw new Annotations2InsertError("unrecognized mongo response: expected one of 'InsertManyResult' or 'InsertOneResult'", mongoRes)
    }
  }

  ////////////////////////////////////////////////////////////////
  // insert / updates

  /**
   * insert a single annotation
   * @private
   * @param {object} annotation
   * @returns {InsertResponseType}
   */
  async #insertOne(annotation) {
    try {
      const resultCursor = await this.annotationsCollection.insertOne(annotation);
      return this.#makeInsertResponse(resultCursor);
    } catch (err) {
      this.#throwMongoError("insert", err);
    }
  }

  /**
   * insert annotations from an array of annotations
   * @private
   * @param {object[]} annotationArray
   * @returns {InsertResponseType}
   */
  async #insertMany(annotationArray) {
    try {
      const resultCursor = await this.annotationsCollection.insertMany(annotationArray);
      return this.#makeInsertResponse(resultCursor);
    } catch (err) {
      this.#throwMongoError("insert", err);
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
   * validate and insert annotations from an annotation list.
   * @param {object} annotationList
   * @returns {Promise<InsertResponseType>}
   */
  async insertAnnotationList(annotationList) {
    const annotationArray = this.#cleanAnnotationList(annotationList);
    return this.#insertMany(annotationArray);
  }

  ////////////////////////////////////////////////////////////////
  // get

  /**
   * @param {object} queryObj
   * @param {object?} projectionObj: extra projection fields to tailor the reponse format
   * @returns {Promise<object[]>}
   */
  async find(queryObj, projectionObj) {
    return this.annotationsCollection
      .find(queryObj, {
        // .project 0 removes the fields from the response, 1 incldes it (but exclude all others)
        // see: https://www.mongodb.com/docs/drivers/node/current/crud/query/project/#std-label-node-project
        projection: {
          _id: 0,
          "on.manifestShortId": 0,
          ...projectionObj
        }
      })
      .toArray();
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
   * @returns
   */
  async search(queryUrl, manifestShortId, q, motivation) {
    // TODO: update inserts so that our data format is more strict, for easier searches:
    //  - motivations:
    //    - "motivation" key is always named "motivation", not "oa:Motivation"
    //    - "motivation" is always an array of `oa:...` fields.
    //  - embedded textual bodies:
    //    - existnce of an ETB is specified by "resource.@type = "dctypes:Text":string,
    //    - "resource.chars" always contains the string content.

    // TODO tests

    const
      queryBase = { "on.manifestShortId": manifestShortId },
      queryFilters = { $and: [] };

    // expand query parameters
    if ( q ) {
      console.log(this.funcName(this.search), "q", q);
      queryFilters.$and.push({
        $or: [
          { "@id": q },
          { "resource.@id": q },
          { "resource.chars": q }
        ]
      });
    }
    if ( motivation ) {
      console.log(this.funcName(this.search), "motivation", motivation);
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

    console.log(this.funcName(this.search), query);

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

export default Annnotations2;