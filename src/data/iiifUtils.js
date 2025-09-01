import { getHash } from "#data/utils.js";

const IIIF_PRESENTATION_2 = 2;
const IIIF_PRESENTATION_3 = 3;
const IIIF_SEARCH_1 = 1;
const IIIF_SEARCH_2 = 2;
const IIIF_PRESENTATION_2_CONTEXT = { "@context": "http://iiif.io/api/presentation/2/context.json" };
const IIIF_PRESENTATION_3_CONTEXT = { "@context": "http://iiif.io/api/presentation/3/context.json" };

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

export {
  IIIF_PRESENTATION_2,
  IIIF_PRESENTATION_3,
  IIIF_SEARCH_1,
  IIIF_SEARCH_2,
  IIIF_PRESENTATION_2_CONTEXT,
  IIIF_PRESENTATION_3_CONTEXT,
  getManifestShortId
}