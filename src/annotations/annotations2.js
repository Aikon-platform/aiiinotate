// IIIF Presentation API 2.x to internal `annotations` model data converters
import { v4 as uuidv4 } from "uuid"

import { objectHasKey, addKeyValueToObjIfHasKey, isNullish, getHash } from "#annotations/utils.js";

const dcTypesToWebAnnotationTypes = (val) => {
  const converter = {
    "text": "Text",
    "image": "Image",
    "sound": "Sound",
    "dataset": "Dataset",
    // valuies below are not supported
    // "software": "",
    // "interactive":,
    // "event":,
    // "physical object"
  }
  val = val.replace("dctypes:", "").toLocaleLowerCase();
  try {
    return converter[val];
  } catch (err) {
    console.error(`dcTypesToWebAnnotationTypes: no converter for value '${val}'`)
  }
}

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
 * convert the annotation to a SpecificResource
 * adapted from SAS: https://github.com/glenrobson/SimpleAnnotationServer/blob/dc7c8c6de9f4693c678643db2a996a49eebfcbb0/src/main/java/uk/org/llgc/annotation/store/AnnotationUtils.java#L123-L135
 */
const makeTarget = (annotation) => {
  const target = annotation.on;  // either string or SpecificResource
  let specificResource
  if ( typeof(target) === "string" ) {
    let [full, fragment] = target.split("#");
    specificResource = {
      full: full,
      selector: {
        type: "FragmentSelector",
        value: fragment
      }
    }
  } else {
    //TODO : implement if input is a `SpecificResource`.
    // in SAS, specificresources are stored as is, but this will be a problem
    // for compability between IIIF 3 and IIIF 3, since they use different
    // standards for SpecificResources
    console.log(target);
    throw new Error(`makeTarget not implemented if 'annotation.on' is a 'SpecificResource'`)
  }
  return specificResource
}

/**
 * @example
 * x = {
 *  "@id" : "http://aikon.enpc.fr/sas/annotation/wit9_man11_anno165_c10_d47559c226ae4acaae2e50f5bbc6f4e8",
 *  "@type" : "oa:Annotation",
 *  "dcterms:created" : "2025-03-19T14:38:38",
 *  "dcterms:modified" : "2025-03-19T14:38:38",
 *  "resource" : {
 *    "@type" : "dctypes:Text",
 *    "format" : "text/html",
 *    "chars" : "<p></p>",
 *    "https://aikon.enpc.fr/sas/full_text" : "",
 *    "https://iscd.huma-num.fr/sas/full_text" : ""
 *  }
 *  "on" : "https://aikon.enpc.fr/aikon/iiif/v2/wit9_man11_anno165/canvas/c10.json#xywh=5,0,1824,2161",
 *  "motivation" : [ "oa:tagging", "oa:commenting" ],
 *  "@context" : "http://iiif.io/api/presentation/2/context.json",
 *  "label" : ""
 * };
 * annotationToInternal(x)
 * // returns
 * {
 *  "id": "http://aikon.enpc.fr/sas/annotation/wit9_man11_anno165_c10_d47559c226ae4acaae2e50f5bbc6f4e8",
 *  "target": "https://aikon.enpc.fr/aikon/iiif/v2/wit9_man11_anno165/canvas/c10.json#xywh=5,0,1824,2161",
 *  "motivation": [ "oa:tagging", "oa:supplementing" ],  !!! WARNING will need to be back-converted at output
 *  "created" : "2025-03-19T14:38:38",
 *  "modified" : "2025-03-19T14:38:38",
 *  "bodyId": "",
 *  "bodyType": "Text",
 *  "bodyFormat": "text/html",
 *  "bodyValue": ""
 * }
 * @param {object} annotation
 * @returns {object}
 */
function fromIiif2Annotation(annotation) {
  // how AnnotationLists are imported into SAS : https://github.com/glenrobson/SimpleAnnotationServer/blob/dc7c8c6de9f4693c678643db2a996a49eebfcbb0/src/main/java/uk/org/llgc/annotation/store/AnnotationUtils.java#L67
  let out = {
    "id": makeAnnotationId(annotation),
    "target": makeTarget(annotation),  // NOTE: won't work if `annotation.on` is not a string !
    "motivation": [],
  };
  out = addKeyValueToObjIfHasKey(annotation, out, "dcterms:created", "created");
  out = addKeyValueToObjIfHasKey(annotation, out, "dcterms:modified", "modified");
  if ( objectHasKey(annotation, "motivation") ) {
    out.motivation = Array.isArray(annotation.motivation)
      ? annotation.motivation
      : [annotation.motivation]
  }
  if ( objectHasKey(annotation, "resource") ) {
    const resource = annotation.resource;  // source
    out = addKeyValueToObjIfHasKey(resource, out, "@id", "bodyId");
    out = addKeyValueToObjIfHasKey(resource, out, "format", "bodyFormat");
    if ( objectHasKey(resource, "@type") ) {
      const bodyType = dcTypesToWebAnnotationTypes(resource["@type"]);
      out.bodyType = bodyType;
    }
    if (
      objectHasKey(resource, "chars")
      && !(isNullish(resource.chars))
      && resource.chars != "<p></p>"
    ) {
      out.bodyValue = resource.chars
    }
  }
  return out;
}

/**
 * @param {object} annotationList
 * @returns {object[]}
 */
function fromIiif2AnnotationList(annotationList) {
  return annotationList.resources.map(fromIiif2Annotation)
}

export {
  fromIiif2Annotation,
  fromIiif2AnnotationList
}