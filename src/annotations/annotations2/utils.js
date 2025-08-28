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

import { v4 as uuid4 } from "uuid";
import { getHash } from "#annotations/utils.js";


const IIIF_VERSION = 2;
const CONTEXT = { "@context": "http://iiif.io/api/presentation/2/context.json" };

/**
 * extract a manifest's short ID from an URI (not just a IIIF uri).
 * NOTE if the `iiifUri` doesn' follow IIIF  recommendations, the quality of geneated IDs is really degraded : 2 canvases from the same manifest will have different hash.
 * inspired by : https://github.com/glenrobson/SimpleAnnotationServer/blob/dc7c8c6de9f4693c678643db2a996a49eebfcbb0/src/main/java/uk/org/llgc/annotation/store/data/Manifest.java#L123C16-L123C26
 * @param {string} iiifUri
 * @returns {string}
 */
const getManifestShortId = (iiifUri) => {
  const keywords = ["manifest", "sequence", "canvas", "annotation", "list", "range", "layer", "res"]
  let manifestShortId;

  // if it follows the IIIF recommended URI patterns
  for ( let i=0; i < keywords.length; i++ ) {
    if ( iiifUri.includes(keywords[i]) ) {
      const iiifUriArr = iiifUri.split("/");
      manifestShortId = iiifUriArr.at( iiifUriArr.indexOf(keywords[i]) - 1 );
      break;
    }
  }
  // fallback if no manifestShortId was found
  manifestShortId = manifestShortId || getHash(iiifUri);

  return manifestShortId;
}


/**
 * extract the ID of a canvas from a canvas' URI.
 * NOTE this only really works if `canvasUri` follows IIIF URI patterns.
 * @param {string} canvasUri
 * @returns {string}
 */
const getCanvasShortId = (canvasUri) =>
  // IIIF compliant
  canvasUri.includes("/canvas/")
    ? canvasUri.split("/").at(-1).replace(".json", "")
    : getHash(canvasUri);

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
    manifestId = getManifestShortId(target),
    canvasId = getCanvasShortId(target);
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
 * @example "127.0.0.1:3000/data/2/wit9_man11_anno165/annotation/c26_abda6e3c-2926-4495-9787-cb3f3588e47c"
 * @param {string} manifestId
 * @param {string} canvasId
 * @returns {string}
 */
const annotationUri = (manifestId, canvasId) =>
  `${process.env.APP_BASE_URL}/data/${IIIF_VERSION}/${manifestId}/annotation/${canvasId}_${uuid4()}`;

/**
 *
 * @param {object[]} resources: the annotatons
 * @param {string?} label: optional description
 * @returns {object}
 */
const toAnnotationList = (resources, label) => {
  const annotationList = {
    ...CONTEXT,
    "@id": "",  // NOTE: this is invalid according to IIIF 2.1 specs, but SAS also does it
    resources: resources
  }
  if ( label ) {
    annotationList.label = label
  }
  return annotationList;
}

export {
  IIIF_VERSION,
  CONTEXT,
  makeTarget,
  makeAnnotationId,
  annotationUri,
  getManifestShortId,
  toAnnotationList
}