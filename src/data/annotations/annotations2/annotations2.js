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
   * @returns {Promise<object[]>}
   */
  async find(queryObj) {
    return this.annotationsCollection
      .find(queryObj)
      .project({_id:0})  // .project removes the `_id` field from response
      .toArray();
  }

  /**
   * @param {string} canvasUri
   * @param {boolean} asAnnotationList
   * @returns
   */
  async findFromCanvasUri(canvasUri, queryUrl, asAnnotationList=false) {
    const annotations = await this.find({
      "on.full": canvasUri
    })
    return asAnnotationList
      ? toAnnotationList(annotations, queryUrl, `annotations targeting canvas ${canvasUri}`)
      : annotations;
  }
}

export default Annnotations2;