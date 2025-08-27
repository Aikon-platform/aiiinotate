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

const IIIF_VERSION = 2;
const CONTEXT = { "@context": "http://iiif.io/api/presentation/2/context.json" };

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
  annotationUri,
  toAnnotationList
}