/**
 * URI factory for the IIIF Presentation 2.1 standard
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

import { v4 as uuid4 } from "uuid";

const IIIF_VERSION = "2";

/**
 * @example "127.0.0.1:3000/data/2/wit9_man11_anno165/annotation/c26_abda6e3c-2926-4495-9787-cb3f3588e47c"
 * @param {string} manifestId
 * @param {string} canvasId
 * @returns {string}
 */
const annotationUri = (manifestId, canvasId) =>
  `${process.env.APP_BASE_URL}/data/${IIIF_VERSION}/${manifestId}/annotation/${canvasId}_${uuid4()}`;

export {
  annotationUri,
}