import { v4 as uuid4 } from "uuid";
import { getHash, isNullish, isObject } from "#data/utils/utils.js";
import { IIIF_PRESENTATION_2, IIIF_PRESENTATION_2_CONTEXT } from "#data/utils/iiifUtils.js";


// IIIF PRESENTATION 2.1 RECOMMENDED URI PATTERNS https://iiif.io/api/presentation/2.1/#a-summary-of-recommended-uri-patterns
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
 * extract a manifest's short ID from an URI (not just a IIIF uri).
 * NOTE if the `iiifUri` doesn' follow IIIF 2.x  recommendations, the quality of geneated IDs is really degraded : 2 canvases URI from the same manifest will generate a different hash.
 * inspired by : https://github.com/glenrobson/SimpleAnnotationServer/blob/dc7c8c6de9f4693c678643db2a996a49eebfcbb0/src/main/java/uk/org/llgc/annotation/store/data/Manifest.java#L123C16-L123C26
 * @param {string} iiifUri
 * @returns {string}
 */
const getManifestShortId = (iiifUri) => {
  const keywords = ["manifest", "manifest.json", "sequence", "canvas", "annotation", "list", "range", "layer", "res"]
  let manifestShortId;

  const iiifUriArr = iiifUri.split("/");

  // if it follows the IIIF recommended URI patterns
  for ( let i=0; i < keywords.length; i++ ) {
    if ( iiifUriArr.includes(keywords[i]) ) {
      manifestShortId = iiifUriArr.at( iiifUriArr.indexOf(keywords[i]) - 1 );
      break;
    }
  }
  // fallback if no manifestShortId was found: return a string representation of the URI's hash.
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
  let targetOut;

  if ( typeof(target) === "string" ) {
    // remove the fragment if necesary to get the full Canvas Id
    const hashIdx = target.indexOf("#");
    targetOut = hashIdx === -1
      ? target
      : target.substring(0, hashIdx);

  } else {
    // it's a SpecificResource => get the full image's id.
    targetOut = target["full"];
  }
  if ( isNullish(targetOut) ) {
    throw new Error(`${getAnnotationTarget.name}: 'annotation.on' is not a valid IIIF 2.1 annotation target (with annotation=${target})`)
  }
  return targetOut;
}

/**
 * convert the annotation's `on` to a SpecificResource
 * reimplemented from SAS: https://github.com/glenrobson/SimpleAnnotationServer/blob/dc7c8c6de9f4693c678643db2a996a49eebfcbb0/src/main/java/uk/org/llgc/annotation/store/AnnotationUtils.java#L123-L135
 */
const makeTarget = (annotation) => {
  const
    // must be either string or SpecificResource
    target = annotation.on,
    // error that will raise is `target` can't be processed
    err = new Error(`${makeTarget.name}: could not make target for annotation: 'annotation.on' must be an URI or an object with 'annotation.on.@type==="oa:SpecificResource"' and 'annotation.on.@id' must be a string URI (annotation=${annotation})`);

  let specificResource;

  // convert to SpecificResource if it's not aldready the case
  if ( typeof(target) === "string" && !isNullish(target) ) {
    let [full, fragment] = target.split("#");
    specificResource = {
      "@type": "oa:SpecificResource",
      full: full,
      selector: {
        "@type": "oa:FragmentSelector",
        value: fragment
      }
    }
  } else if ( isObject(target) ) {
    // if 'target' is an object but not a specificresource, raise.
    if ( target["@type"] === "oa:SpecificResource" && !isNullish(target["full"]) ) {
      specificResource = target;

      // the received specificResource `selector` may have its type specified using the key `type`. correct it to `@type`.
      if ( isObject(target.selector) && Object.keys(target.selector).includes("type") ) {
        target.selector["@type"] = target.selector.type;
        delete target.selector.type;
      }
    } else {
      throw err
    }
  } else {
    throw err
  }

  return specificResource
}

/**
 * generate the annotation's ID from its `@id` key (if defined)
 * reimplementated from SAS: https://github.com/glenrobson/SimpleAnnotationServer/blob/dc7c8c6de9f4693c678643db2a996a49eebfcbb0/src/main/java/uk/org/llgc/annotation/store/AnnotationUtils.java#L90-L97
 * NOTE this should never fail, but results will only be reliable if the `annotation.on` follows the IIIF 2.1 canvas URI scheme
 */
const makeAnnotationId = (annotation, manifestShortId) => {
  const
    target = getAnnotationTarget(annotation),
    canvasId = getCanvasShortId(target);
  // if manifestShortId hasn't aldready been extracted, re-extract it
  manifestShortId = manifestShortId || getManifestShortId(target);

  if ( isNullish(manifestShortId) || isNullish(canvasId) ) {
    throw new Error(`${makeAnnotationId.name}: could not make an 'annotationId' (with manifestShortId=${manifestShortId}, annotation=${annotation})`)
  }

  return annotationUri(manifestShortId, canvasId);
}

/**
 * @example "127.0.0.1:3000/data/2/wit9_man11_anno165/annotation/c26_abda6e3c-2926-4495-9787-cb3f3588e47c"
 * @param {string} manifestId
 * @param {string} canvasId
 * @returns {string}
 */
const annotationUri = (manifestId, canvasId) =>
  `${process.env.APP_BASE_URL}/data/${IIIF_PRESENTATION_2}/${manifestId}/annotation/${canvasId}_${uuid4()}`;

/**
 *
 * @param {object[]} resources: the annotatons
 * @param {string?} annotationListId: the AnnotationList's '@id' key
 * @param {string?} label: optional description
 * @returns {object}
 */
const toAnnotationList = (resources, annotationListId, label) => {
  const annotationList = {
    ...IIIF_PRESENTATION_2_CONTEXT,
    "@id": annotationListId || "",  // NOTE: MUST be defined according to IIIF presentation API (but not always defined in SAS)
    resources: resources
  }
  if ( label ) {
    annotationList.label = label
  }
  return annotationList;
}

export {
  makeTarget,
  makeAnnotationId,
  annotationUri,
  toAnnotationList,
  getManifestShortId,
  getCanvasShortId,
  getAnnotationTarget
}