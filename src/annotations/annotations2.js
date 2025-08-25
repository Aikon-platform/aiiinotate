// IIIF Presentation API 2.x to internal `annotations` model data converters
import { v4 as uuidv4 } from "uuid"

import AnnotationsAbstract from "#annotations/annotationsAbstract";
import { objectHasKey, addKeyValueToObjIfHasKey, isNullish, getHash } from "#annotations/utils.js";

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
   */
  constructor(db, client) {
    super(db, client);
  }

  /**
   * clean an annotation before saving it to database
   * @param {object} annotation
   * @returns {object}
   */
    cleanAnnotation(annotation) {

      //TODO context
      //TODO (maybe) process annotation.body["@id"]
      console.log(`${this.className()}.${this.funcName(this.cleanAnnotation)} : check TODOs !`);

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
      return annotationList.resources.map(this.cleanAnnotation)
    }

    /** @param {object} annotation */
    async insertOne(annotation) {
      //TODO
    }

    /** @param {object[]} annotationArray */
    async insertMany(annotationArray) {
      //TODO
    }

    /**
     * insert annotations from an annotation list.
     * @param {object} annotationArray
     */
    async insertAnnotationList(annotationList) {
      const annotationArray = this.cleanAnnotationList(annotationList);
      this.insertMany(annotationArray);
    }

}

export default Annnotations2;