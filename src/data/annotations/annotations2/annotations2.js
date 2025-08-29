/**
 * IIIF presentation 2.1 annotation internals: convert incoming data, interct with the database, return data.
 * exposes an `Annnotations2` class that should contain everything you need
 */

import AnnotationsAbstract from "#annotations/annotationsAbstract.js";
import { objectHasKey, isNullish } from "#data/utils.js";
import { makeTarget, makeAnnotationId, toAnnotationList } from "#annotations/annotations2/utils.js";
import { getManifestShortId, IIIF_PRESENTATION_2_CONTEXT } from "#data/iiifUtils.js";

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
 * @extends {AnnotationsAbstract}
 */
class Annnotations2 extends AnnotationsAbstract {

  /**
   * @param {import("mongodb").MongoClient} client
   * @param {import("mongodb").Db} db
   */
  constructor(client, db) {
    super(client, db, db.collection("annotations2"));
  }

  ////////////////////////////////////////////////////////////////
  // utils

  /**
   * clean an annotation before saving it to database.
   *
   * the main transforms are:
   * - transfrom `annotation.on` to a SpecificResource
   * - extract the manifest's URI
   * - generate a clean annotation ID from manifest ID and canvas number
   * - remove body if it's empty
   *
   * @param {object} annotation
   * @returns {object}
   */
  cleanAnnotation(annotation) {

    //TODO (maybe) process annotation.body["@id"]
    console.log(`${this.funcName(this.cleanAnnotation)} : check TODOs !`);

    const
      annotationTarget = makeTarget(annotation),
      manifestShortId = getManifestShortId(annotationTarget.full);

    annotation["@id"] = makeAnnotationId(annotation, manifestShortId);
    annotation["@context"] = IIIF_PRESENTATION_2_CONTEXT["@context"];
    annotation.on = annotationTarget;
    annotation.on.manifestShortId = manifestShortId;

    const resource = annotation.resource || undefined;
    if ( resource ) {
      // remove body if it's empty. a body is empty if
      //  - it's got no `@id` and
      //  - it's not an Embedded Textual Body, or it's an empty Embedded Textual Body.
      // see: https://github.com/Aikon-platform/aiiinotate/blob/dev/docs/specifications/0_w3c_open_annotations.md#embedded-textual-body-etb
      const
        hasTextualBody = objectHasKey(resource, "chars") || objectHasKey(resource, "cnt:chars"),
        resourceChars = resource.chars || resource["cnt:chars"],
        emptyBody = isNullish(resourceChars) || resourceChars === "<p></p>",
        resourceId = resource["@id"];
      if (
        isNullish(resourceId) && (!hasTextualBody || emptyBody)
      ) {
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
  cleanAnnotationList(annotationList) {
    if (
      annotationList["@type"] !== "sc:AnnotationList"
      || !objectHasKey(annotationList, "@id")
      || !Array.isArray(annotationList.resources)
    ) {
      this.errorMessage(this.cleanAnnotationList, `could not recognize AnnotationList. see: https://iiif.io/api/presentation/2.1/#annotation-list. received: ${annotationList}`)
    }
    //NOTE: using an arrow function is necessary to avoid losing the scope of `this`.
    // otherwise, `this` is undefined in `cleanAnnotation`.
    return annotationList.resources.map((ressource) => this.cleanAnnotation(ressource))
  }

  ////////////////////////////////////////////////////////////////
  // insert / updates

  /** @param {object} annotation */
  async insertOne(annotation) {
    this.errorMessage(this.insertOne, "not implemented")
  }

  /**
   * @param {object[]} annotationArray
   * @return {Array}
   */
  async insertMany(annotationArray) {
    try {
      const resultCursor = await this.annotationsCollection.insertMany(annotationArray);
      return resultCursor.insertedIds;
    } catch (e) {
      console.log(e);
      throw e;  // TODO polish, this is a bit brutal currently.
    }
  }

  /**
   * insert annotations from an annotation list.
   * @param {object} annotationArray
   * @returns {Promise<Array>}
   */
  async insertAnnotationList(annotationList) {
    const annotationArray = this.cleanAnnotationList(annotationList);
    return this.insertMany(annotationArray);
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