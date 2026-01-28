import { v4 as uuid4 } from "uuid";

import { maybeToArray, getHash, isNullish, isObject, objectHasKey, visibleLog } from "#utils/utils.js";
import { IIIF_PRESENTATION_2, IIIF_PRESENTATION_2_CONTEXT } from "#utils/iiifUtils.js";
import { svgStringToXywh } from "#utils/svg.js";

/** @typedef {import("#types").MongoCollectionType} MongoCollectionType */

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
 * extract a manifest's short ID from a IIIF URI.
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
 * @returns {string[]}
 */
const getAnnotationTarget = (annotation) => {
  /** annotation.on is converted to an array of targets => extract the target for each item of the array */
  const getSingleAnnotationTarget = (_target) => {
    let _targetOut;

    if ( typeof(_target) === "string" ) {
      // remove the fragment if necesary to get the full Canvas Id
      const hashIdx = _target.indexOf("#");
      _targetOut = hashIdx === -1
        ? _target
        : _target.substring(0, hashIdx);

    } else {
      // it's a SpecificResource => get the full image's id.
      _targetOut = _target["full"];
    }
    if ( isNullish(_targetOut) ) {
      throw new Error(`${getAnnotationTarget.name}: 'annotation.on' is not a valid IIIF 2.1 annotation target (with annotation=${_target})`)
    }
    return _targetOut;
  }

  return maybeToArray(annotation.on).map(getSingleAnnotationTarget);
}

/**
 * @example "127.0.0.1:3000/data/2/wit9_man11_anno165/annotation/c26_abda6e3c-2926-4495-9787-cb3f3588e47c"
 * @param {string} manifestShortId
 * @param {string} canvasId
 * @returns {string}
 */
const toAiiinotateAnnotationUri = (manifestShortId, canvasId) =>
  `${process.env.AIIINOTATE_BASE_URL}/data/${IIIF_PRESENTATION_2}/${manifestShortId}/annotation/${canvasId}_${uuid4()}`;

const toAiiinotateManifestUri = (manifestShortId) =>
  `${process.env.AIIINOTATE_BASE_URL}/data/${IIIF_PRESENTATION_2}/${manifestShortId}/manifest.json`;

/**
 * if `canvasUri` follows the recommended IIIF 2.1 recommended URI pattern, convert it to a JSON manifest URI.
 * @param {string} canvasUri
 * @returns {string} : the manifest URI
 */
const canvasUriToManifestUri = (canvasUri) =>
  canvasUri.split("/").slice(0,-2).join("/") + "/manifest.json";

/** @returns {number[]?} */
const fragmentSelectorToXywh = (fragmentSelector) => {
  // fragmentSelector is of format: `$rootUrl#xywh=number,number,number,number`
  // => get the `number,number,number,number` part
  const selectorValue = (fragmentSelector.value || "").split("xywh=");
  const xywhString = selectorValue.length > 1 ? selectorValue[1] : ""
  if (xywhString.length) {
    return xywhString.split(",").map((x) => parseInt(x));
  }
  return
}

/** @returns {Promise<number[]?>} */
const svgSelectorToXywh = (svgSelector) => {
  try {
    return svgStringToXywh(svgSelector.value);
  } catch (err) {
    // TODO
    ""
    throw err;
  }
}

/** @returns {Promise<number[]?>} */
const choiceSelectorToXywh = async (choiceSelector) => {
  let xywh;
  for ( const selector of [choiceSelector.item, choiceSelector.default] ) {
    xywh = await selectorToXywh(selector);
    if ( xywh?.length ) {
      break;
    }
  }
  return xywh;
}

/** @returns {Promise<number[]?>} */
const selectorToXywh = async (selector) => {
  const mapper = [
    ["oa:Choice", choiceSelectorToXywh],
    ["oa:SvgSelector", svgSelectorToXywh],
    ["oa:FragmentSelector", fragmentSelectorToXywh],
    ["Choice", choiceSelectorToXywh],
    ["SvgSelector", svgSelectorToXywh],
    ["FragmentSelector", fragmentSelectorToXywh],
  ]
  let xywh;
  for ( const [selectorName, func] of mapper ) {
    if ( selector["@type"] === selectorName ) {
      xywh = await func(selector);
      if ( xywh?.length ) {
        break
      }
    }
  }
  return xywh
}

const normalizeSelectorType = (selector) => {
  // the received specificResource `selector` may have its type specified using the key `type`. correct it to `@type`.
  if (
    isObject(selector) && Object.keys(selector).includes("type")
  ) {
    selector["@type"] = selector.type;
    delete selector.type;
  }
  return selector;
}

const stringToSpecificResource = (target) => {
  let [full, fragment] = target.split("#");
  return {
    "@id": target,
    "@type": "oa:SpecificResource",
    full: full,
    selector: {
      "@type": "oa:FragmentSelector",
      value: fragment
    }
  }
}

/**
 * handle a single value of `annotation.on` (when annotation.on is an array).
 * essentially, this function ensures the `target` is a `SpecificResource` and extracts useful fields.
 * @returns {Promise<object>}
 */
const makeSingleTarget = async (target) => {
  const err = new Error(`${makeSingleTarget.name}: could not make target for annotation: 'annotation.on' must be an URI, a SpecificResouece or an array of SpecificResources`, { info: target });

  let specificResource;

  // 1. convert to SpecificResouece
  if ( typeof(target) === "string" && !isNullish(target) ) {
    specificResource = stringToSpecificResource(target);
  } else if ( isObject(target) && target["@type"] === "oa:SpecificResource" && !isNullish(target["full"]) ) {
    specificResource = target;
    specificResource.selector = normalizeSelectorType(specificResource.selector);
  // if target is neither a string nor a SpecificResource, raise
  } else {
    throw err
  }

  // 2. extract relevant fields
  // extract xywh coordinates and return them as [x:int, y:int, w:int, h:int]
  // NOTE: xywh extraxction is only supported for FragmentSelector and SvgSelector (or an oa:Choice containing either).
  specificResource.xywh = await selectorToXywh(specificResource.selector);
  specificResource.manifestShortId = getManifestShortId(specificResource.full);
  specificResource.manifestUri = canvasUriToManifestUri(specificResource.full);

  return specificResource
}

/**
 * convert the annotation's `on` to a SpecificResource
 * reimplemented from SAS: https://github.com/glenrobson/SimpleAnnotationServer/blob/dc7c8c6de9f4693c678643db2a996a49eebfcbb0/src/main/java/uk/org/llgc/annotation/store/AnnotationUtils.java#L123-L135
 * @param {object} annotation
 * @returns {Promise<object[]>} - the array of targets extracted from 'annotation.on'
 */
const makeTarget = async (annotation) => {
  return await Promise.all(
    maybeToArray(annotation.on).map(async (target) => await makeSingleTarget(target))
  );
}

/**
 * generate the annotation's ID from its `@id` key (if defined)
 * reimplementated from SAS: https://github.com/glenrobson/SimpleAnnotationServer/blob/dc7c8c6de9f4693c678643db2a996a49eebfcbb0/src/main/java/uk/org/llgc/annotation/store/AnnotationUtils.java#L90-L97
 * NOTE this should never fail, but results will only be reliable if the `annotation.on` follows the IIIF 2.1 canvas URI scheme
 */
const makeAnnotationId = (annotation, manifestShortId) => {
  // we consider that all targets point to the same canvas and manifest => extract canvas and manifest info from the 1st target.
  const targetArray = getAnnotationTarget(annotation);
  if ( targetArray.length < 1 ) {
    throw new Error(`${makeAnnotationId.name}: could not extract target from annotation`)
  }
  const
    firstTarget = targetArray[0],
    canvasId = getCanvasShortId(firstTarget);
  // if manifestShortId hasn't aldready been extracted, re-extract it
  manifestShortId = manifestShortId || getManifestShortId(firstTarget);

  if ( isNullish(manifestShortId) || isNullish(canvasId) ) {
    throw new Error(`${makeAnnotationId.name}: could not make an 'annotationId' (with manifestShortId=${manifestShortId}, annotation=${annotation})`)
  }

  return toAiiinotateAnnotationUri(manifestShortId, canvasId);
}

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
    "@type": "sc:AnnotationList",
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
  toAiiinotateAnnotationUri,
  toAiiinotateManifestUri,
  toAnnotationList,
  getManifestShortId,
  getCanvasShortId,
  getAnnotationTarget,
  canvasUriToManifestUri,
}