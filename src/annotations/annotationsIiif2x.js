// IIIF Presentation API 2.x to internal `annotations` model data converters

import { objectHasKey, addKeyValueToObjIfHasKey, isNullish } from "#annotation/utils.js";

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
  let out = {
    "id": annotation["@id"],
    "target": annotation.target,
    "motivation": [],
  };
  out = addKeyValueToObjIfHasKey(annotation, out, "dcterms:created");
  out = addKeyValueToObjIfHasKey(annotation, out, "dcterms:modified");
  if ( objectHasKey(annotation, "motivation") ) {
    out.motivation = Array.isArray(annotation.motivation)
      ? annotation.motivation
      : [annotation.motivation]
  }
  if ( objectHasKey(annotation, "resource") ) {
    const resource = annotation.resource;  // source
    out = addKeyValueToObjIfHasKey(resource, out, "@id", "bodyId");
    out = addKeyValueToObjIfHasKey(resource, out, "@type", "bodyType");
    out = addKeyValueToObjIfHasKey(resource, out, "format", "bodyFormat");
    if (
      objectHasKey(resource, "chars")
      && !(isNullish(resource.chars))
      && resource.chars != "<p></p>"
    ) {
      out.bodyValue = resource.chars
    }
  }
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