import { getHash } from "#data/utils.js";

const IIIF_PRESENTATION_2 = 2;
const IIIF_PRESENTATION_3 = 3;
const IIIF_SEARCH_1 = 1;
const IIIF_SEARCH_2 = 2;
const IIIF_PRESENTATION_2_CONTEXT = { "@context": "http://iiif.io/api/presentation/2/context.json" };
const IIIF_PRESENTATION_3_CONTEXT = { "@context": "http://iiif.io/api/presentation/3/context.json" };

/**
 * extract a manifest's short ID from an URI (not just a IIIF uri).
 * NOTE if the `iiifUri` doesn' follow IIIF 2.x  recommendations, the quality of geneated IDs is really degraded : 2 canvases URI from the same manifest will generate a different hash.
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

export {
  IIIF_PRESENTATION_2,
  IIIF_PRESENTATION_3,
  IIIF_SEARCH_1,
  IIIF_SEARCH_2,
  IIIF_PRESENTATION_2_CONTEXT,
  IIIF_PRESENTATION_3_CONTEXT,
  getManifestShortId
}