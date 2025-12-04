import { v4 as uuid4 } from "uuid";

import { getRandomItem } from "#utils/utils.js";

/**
 * generate an array of length `length` filled with values returned by `itemFunc`
 * @param {number} length
 * @param {Function} itemFunc
 * @returns {Array}
 */
const fillArray = (length, itemFunc) =>
  Array.from({length: length}, itemFunc)

/** @returns {string} - matches "int,int,int.int" */
const makeXywh = () =>
  fillArray(4, () => Math.floor(Math.random() * 1000))
    .sort()
    .join(",");

const makeRandomNumber = (maxNum=1000) => Math.floor(Math.random() * maxNum);

const makeManifestShortId = () =>
  `wit${makeRandomNumber()}_pdf${makeRandomNumber()}_anno${makeRandomNumber()}`;

const makeBaseUrl = (manifestShortId) =>
  `${process.env.AIIINOTATE_BASE_URL}/data/2/${manifestShortId}`;

const makeAnnotationId = (manifestShortId) =>
  `${makeBaseUrl(manifestShortId)}/annotation/a_${uuid4()}`;

const makeManifestId = (manifestShortId) =>
  `${makeBaseUrl(manifestShortId)}/manifest.json`;

const makeCanvasId = (manifestShortId) =>
  `${makeBaseUrl(manifestShortId)}/canvas/c_${uuid4()}`;

const makeAnnotationListId = (manifestShortId) =>
  `${makeBaseUrl(manifestShortId)}/list/l_${uuid4()}`;

const makeIiif2Manifest = (manifestShortId, canvasArray) => ({
  "@context": "http://iiif.io/api/presentation/2/context.json",
  "@id": makeManifestId(manifestShortId),
  "label": "test aiiinotate manifest",
  "attribution": "",
  "seeAlso": [
    "http://oai.bnf.fr/oai2/OAIHandler?verb=GetRecord&metadataPrefix=oai_dc&identifier=oai:bnf.fr:gallica/ark:/12148/btv1b8490076p"
  ],
  "description": "this is a test IIIF manifest for aiiinotate testing purposes",
  "metadata": [],
  "sequences": [
    {
      "canvases": canvasArray,
      "label": "Current Page Order",
      "@type": "sc:Sequence",
      "@id": `${makeManifestId(manifestShortId)}/sequence/default`
    }
  ],
  "thumbnail": {
    "@id": "https://gallica.bnf.fr/ark:/12148/btv1b8490076p.thumbnail"
  },
  "@type": "sc:Manifest",
})

const makeIiif2Canvas = (canvasId) => ({
  "@context": "http://iiif.io/api/presentation/2/context.json",
  "@id": canvasId,
  "label": "plat supérieur",
  "height": 6044,
  "width": 4768,
  "images": [
    {
      "motivation": "sc:painting",
      "on": canvasId,
      "resource": {
        "format": "image/jpeg",
        "service": {
          "profile": "http://library.stanford.edu/iiif/image-api/1.1/compliance.html#level2",
          "@context": "http://iiif.io/api/image/1/context.json",
          "@id": `${canvasId}_img.png`
        },
        "height": 6044,
        "width": 4768,
        "@id": `${canvasId}_img.png/full/full/0/native.jpg`,
        "@type": "dctypes:Image"
      },
      "@type": "oa:Annotation"
    }
  ],
  "@type": "sc:Canvas"
})

const makeIiif2AnnotationList = (manifestShortId, annotationArray) => ({
  "@context": "http://iiif.io/api/presentation/2/context.json",
  "@type": "sc:AnnotationList",
  "@id": makeAnnotationListId(manifestShortId),
  "resources": annotationArray
})

const makeIiif2Annotation = (annotationId, canvasId) => ({
  "@context": "http://iiif.io/api/presentation/2/context.json",
  "@id": annotationId,
  "@type": "oa:Annotation",
  "resource": {
    "@type": "dctypes:Text",
    "format": "text/html",
    "chars": ""
  },
  "on": `${canvasId}#xywh=${makeXywh()}`,
  "motivation": [
    "oa:tagging",
    "oa:commenting"
  ],
  "label": ""
})

/**
 * @param {string} manifestShortId
 * @param {string[]} canvasIdArray
 * @returns {object}
 */
const generateIiif2AnnotationList = (manifestShortId, canvasIdArray) =>
  makeIiif2AnnotationList(
    canvasIdArray.map((canvasId) =>
      makeIiif2Annotation(
        makeAnnotationId(manifestShortId),
        canvasId
      )
    )
  );


/**
 * @param {number} nCanvas - integer, number of canvases in the manifest
 * @returns {object}
 */
const generateIiif2Manifest = (nCanvas) => {
  const manifestShortId = makeManifestShortId();
  return makeIiif2Manifest(
    manifestShortId,
    fillArray(nCanvas, () => makeCanvasId(manifestShortId))
      .map((canvasId) => makeIiif2Canvas(canvasId))
  )
}

/**
 * return an array of [manifest, annotationList].
 * manifest has `nCanvas` canvases, `annotationList` has `nAnnotations` annotation on the canvases of the generated manifest.
 * @param {number} nCanvas
 * @param {number} nAnnotations
 * @returns
 */
const generateIiif2ManifestAndAnnotationsList = (nCanvas, nAnnotations) => {
  const
    manifestShortId = makeManifestShortId(),
    manifest = makeIiif2Manifest(
      manifestShortId,
      fillArray(nCanvas, () => makeCanvasId(manifestShortId))
        .map((canvasId) => makeIiif2Canvas(canvasId))
    ),
    canvasIdArray = fillArray(
      nAnnotations,
      () => getRandomItem(manifest.sequences[0].canvases)
    ).map((canvas) => canvas["@id"]),
    annotationList = makeIiif2AnnotationList(manifestShortId, canvasIdArray);

  return [manifest, annotationList];
}

export {
  generateIiif2Manifest,
  generateIiif2AnnotationList,
  generateIiif2ManifestAndAnnotationsList
}