/**
 * IIIF presentation 2.1 annotation internals: convert incoming data, interct with the database, return data.
 * exposes an `Annnotations2` class that should contain everything you need
 */

import { v4 as uuidv4 } from "uuid"

import AnnotationsAbstract from "#annotations/annotationsAbstract.js";
import { objectHasKey, isNullish, getHash } from "#annotations/utils.js";

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
  let annotationId = annotation["@id"];
  if ( isNullish(annotationId) ) {
    annotationId = `${process.env.APP_HOST}/${getHash(getAnnotationTarget(annotation))}/${uuidv4()}`;
    console.log(annotationId);
  }
  return annotationId
}

/**
 * convert the annotation's `on` to a SpecificResource
 * reimplemented from SAS: https://github.com/glenrobson/SimpleAnnotationServer/blob/dc7c8c6de9f4693c678643db2a996a49eebfcbb0/src/main/java/uk/org/llgc/annotation/store/AnnotationUtils.java#L123-L135
 */
const makeTarget = (annotation) => {
  const target = annotation.on;  // either string or SpecificResource
  let specificResource

  // convert to SpecificResource if necessary
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
  /**
   * @param {import("mongodb").Db} db
   * @param {import("mongodb").MongoClient} client
   * @param {import("mongodb").Collection} annotationsCollection
   */
  constructor(client, db, annotationsCollection) {
    super(client, db, annotationsCollection);
  }

  ////////////////////////////////////////////////////////////////

  /**
   * clean an annotation before saving it to database
   * @param {object} annotation
   * @returns {object}
   */
  cleanAnnotation(annotation) {

    //TODO context
    //TODO (maybe) process annotation.body["@id"]
    console.log(`${this.funcName(this.cleanAnnotation)} : check TODOs !`);

    annotation["@id"] = makeAnnotationId(annotation);
    annotation.on = makeTarget(annotation);

    const resource = annotation.resource || undefined;  // source
    if ( resource ) {
      if (
        objectHasKey(resource, "chars")
        && (isNullish(resource.chars) || resource.chars === "<p></p>")
      ) {
        delete(resource.chars);
      }
      annotation.resource = resource;
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
    return annotationList.resources.map((ressources) => this.cleanAnnotation(ressources))
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