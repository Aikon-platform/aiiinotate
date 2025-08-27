/**
 * IIIF presentation 2.1 annotation internals: convert incoming data, interct with the database, return data.
 * exposes an `Annnotations2` class that should contain everything you need
 */

import AnnotationsAbstract from "#annotations/annotationsAbstract.js";
import { objectHasKey, isNullish } from "#annotations/utils.js";
import { annotationUri } from "#annotations/annotations2/uri.js";


/**
 *
 */
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
 * get the `on` of an annotation.
 * reimplemented from SAS: https://github.com/glenrobson/SimpleAnnotationServer/blob/dc7c8c6de9f4693c678643db2a996a49eebfcbb0/src/main/java/uk/org/llgc/annotation/store/AnnotationUtils.java#L147
 * @param {object} annotation
 * @returns {string}
 */
const getAnnotationTarget = (annotation) => {
  const target = annotation.on;  // either string or SpecificResource

  if ( typeof(target) === "string" ) {
    // remove the fragment if necesary to get the full Canvas Id
    const hashIdx = target.indexOf("#");
    return hashIdx === -1
      ? target
      : target.substring(0, hashIdx);

  } else {
    // it's a SpecificResource => get the full image's id.
    return target.get("full")["@id"];
  }
}

/**
 * generate the annotation's ID from its `@id` key (if defined)
 * reimplementated from SAS: https://github.com/glenrobson/SimpleAnnotationServer/blob/dc7c8c6de9f4693c678643db2a996a49eebfcbb0/src/main/java/uk/org/llgc/annotation/store/AnnotationUtils.java#L90-L97
 */
const makeAnnotationId = (annotation) => {
  //NOTE this will work only if the `annotation.on` follows the IIIF 2.1 canvas URI scheme
  const
    target = getAnnotationTarget(annotation),
    targetArray = target.split("/"),
    manifestId = targetArray.at(-3),
    canvasId = targetArray.at(-1).replace(".json", "");
  return annotationUri(manifestId, canvasId);
}

/**
 * convert the annotation's `on` to a SpecificResource
 * reimplemented from SAS: https://github.com/glenrobson/SimpleAnnotationServer/blob/dc7c8c6de9f4693c678643db2a996a49eebfcbb0/src/main/java/uk/org/llgc/annotation/store/AnnotationUtils.java#L123-L135
 */
const makeTarget = (annotation) => {
  const target = annotation.on;  // either string or SpecificResource
  let specificResource;

  // convert to SpecificResource if it's not aldready the case
  if ( typeof(target) === "string" ) {
    let [full, fragment] = target.split("#");
    specificResource = {
      full: full,
      selector: {
        type: "FragmentSelector",
        value: fragment
      }
    }
  }

  return specificResource
}


/**
 * @extends {AnnotationsAbstract}
 */
class Annnotations2 extends AnnotationsAbstract {

  context = "https://iiif.io/api/presentation/2/context.json"

  /**
   * @param {import("mongodb").MongoClient} client
   * @param {import("mongodb").Db} db
   */
  constructor(client, db) {
    super(client, db, db.collection("annotations2"));
  }

  ////////////////////////////////////////////////////////////////

  /**
   * clean an annotation before saving it to database
   * @param {object} annotation
   * @returns {object}
   */
  cleanAnnotation(annotation) {

    //TODO (maybe) process annotation.body["@id"]
    console.log(`${this.funcName(this.cleanAnnotation)} : check TODOs !`);

    annotation["@id"] = makeAnnotationId(annotation);
    annotation.on = makeTarget(annotation);
    annotation["@context"] = this.context;

    const resource = annotation.resource || undefined;  // source
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
}

export default Annnotations2;