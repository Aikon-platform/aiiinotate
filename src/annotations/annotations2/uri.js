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


/**
 * @param {string} manifestId
 * @param {string} canvasId
 * @returns {string}
 */
const annotationUri = (manifestId, canvasId) =>
  `${process.env.APP_HOST}/data/${manifestId}/annotation/${canvasId}_${uuid4()}`;

export {
  annotationUri,
}