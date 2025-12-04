import { v4 as uuidv4 } from "uuid";

/** @returns {string} - matches "int,int,int.int" */
const makeXywh = () =>
  Array.from({length: 4}, () => Math.floor(Math.random() * 1000))
  .sort()
  .join(",");

const makeIiif2Manifest = (manifestId, canvasArray) => ({
  "@id": manifestId,
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
      "@id": `${manifestId}/sequence/default`
    }
  ],
  "thumbnail": {
    "@id": "https://gallica.bnf.fr/ark:/12148/btv1b8490076p.thumbnail"
  },
  "@type": "sc:Manifest",
  "@context": "http://iiif.io/api/presentation/2/context.json"
})

const makeIiif2Canvas = (canvasId) => ({
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

const makeIiif2AnnotationList = (annotationArray) => ({
  "@context": "http://iiif.io/api/presentation/2/context.json",
  "@type": "sc:AnnotationList",
  "@id": `${process.env.AIIINOTATE_BASE_URL}/iiif/list/${uuidv4()}`,
  "resources": annotationArray
})

const makeIiif2Annotation = (annotationId, canvasId) => ({
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
  "@context": "http://iiif.io/api/presentation/2/context.json",
  "label": ""
})

