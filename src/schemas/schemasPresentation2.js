import fastifyPlugin from "fastify-plugin";

import { IIIF_PRESENTATION_2, IIIF_PRESENTATION_2_CONTEXT } from "#utils/iiifUtils.js";

/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */


const oaSelectorTypes = [
  "oa:FragmentSelector",
  "oa:CssSelector",
  "oa:XPathSelector",
  "oa:TextQuoteSelector",
  "oa:TextPositionSelector",
  "oa:DataPositionSelector",
  "oa:SvgSelector",
  "oa:RangeSelector",
  "cnt:ContentAsText",  // this one is only described in IIIF Presentation API.
  // also allow values without extension
  "FragmentSelector",
  "CssSelector",
  "XPathSelector",
  "TextQuoteSelector",
  "TextPositionSelector",
  "DataPositionSelector",
  "SvgSelector",
  "RangeSelector",
  "ContentAsText"
]

const motivationValues = [
  "sc:painting",
  "oa:commenting",
  "oa:describing",
  "oa:tagging",
  "oa:linking"
]

/** @param {string} slug */
const makeSchemaUri = (slug) =>
  `${process.env.APP_BASE_URL}/schemas/presentation/${IIIF_PRESENTATION_2}/${slug}`

/**
 * @param {FastifyInstanceType} fastify
 * @param {"search"|"presentation"} slug
 */
const getSchema = (fastify, slug) =>
  fastify.getSchema(makeSchemaUri(slug))


function addSchemas(fastify, options, done) {

  /////////////////////////////////////////////
  // GENERIC STUFF

  fastify.addSchema({
    $id: makeSchemaUri("context"),
    type: "string",
    enum: [ IIIF_PRESENTATION_2_CONTEXT["@context"] ]
  });

  /////////////////////////////////////////////
  // SPECIFIC RESOURCES

  // derived from: https://iiif.io/api/annex/openannotation/context.json
  fastify.addSchema({
    $id: makeSchemaUri("iiifImageApiSelector"),
    type: "object",
    required: [ "@id", "@type", "@context" ],
    properties: {
      "@id": { type: "string" },
      "@type": {
        type: "string",
        enum: [ "iiif:ImageApiSelector" ]
      },
      "@context": { $ref: makeSchemaUri("context") },
      region: { type: "string" },
      size: { type: "string" },
      rotation: { type: "string" },
      format: { type: "string" },
      quality: { type: "string" },
    }
  });

  // NOTE: we don't support refinedBy and any other recursive selectors.
  // https://github.com/Aikon-platform/aiiinotate/blob/main/docs/specifications/0_w3c_web_annotations.md#selectors-data-model
  fastify.addSchema({
    $id: makeSchemaUri("oaSelector"),
    type: "object",
    required: [ "@type" ],  // could also add `value` or `chars` but one or the other may be used, not both.
    properties: {
      "@id": { type: "string" },
      "@type": {
        anyOf: [
          {
            type: "string",
            enum: oaSelectorTypes
          },
          {
            // IIIF 2.1 has examples with multiple `@types`: // `chars` is used by SvgSelector in: https://iiif.io/api/presentation/2.1/#non-rectangular-segments
            type: "array",
            items: {
              type: "string",
              enum: oaSelectorTypes
            }
          }
        ]
      },
      value: { type: "string" },
      chars: { type: "string" }  // `chars` is used by SvgSelector in: https://iiif.io/api/presentation/2.1/#non-rectangular-segments
    }
  })

  fastify.addSchema({
    $id: makeSchemaUri("oaOrIiifSelector"),
    type: "object",
    oneOf: [
      { $ref: makeSchemaUri("oaSelector") },
      { $ref: makeSchemaUri("iiifImageApiSelector") },
    ]
  })

  fastify.addSchema({
    $id: makeSchemaUri("oaChoiceSelector"),
    type: "object",
    required: [ "@type", "default" ],
    properties: {
      "@type": { type: "string", enum: ["oa:Choice"] },
      default: { $ref: makeSchemaUri("oaOrIiifSelector") },
      item: { $ref: makeSchemaUri("oaOrIiifSelector") }
    }
  })

  // selector is either a string, string[], iiifImageApiSelector, iiifImageApiSelector[]. oaSelector, oaSelector[]
  fastify.addSchema({
    $id: makeSchemaUri("selector"),
    anyOf: [
      { type: "string" },
      { type: "array", items: { type: "string" } },
      { $ref: makeSchemaUri("oaOrIiifSelector") },
      { $ref: makeSchemaUri("oaChoiceSelector") },
      {
        type: "array",
        items: { $ref: makeSchemaUri("oaOrIiifSelector") }
      },
      // {
      //   type: "array",
      //   items: { $ref: makeSchemaUri("iiifImageApiSelector") }
      // }
    ]
  })

  fastify.addSchema({
    $id: makeSchemaUri("specificResource"),
    type: "object",
    required: [ "@type", "full", "selector" ],
    properties: {
      "@id": { type: "string" },
      "@type": {
        type: "string",
        enum: [ "oa:SpecificResource" ]
      },
      // NOTE: OA defines a `source` field for SpecificResources, but in IIIF `full` seems to have the same role
      // https://github.com/Aikon-platform/aiiinotate/blob/main/docs/specifications/0_w3c_web_annotations.md#specific-resources-data-model
      full: {
        anyOf: [
          // URI
          { type: "string" },
          // object describing an image
          {
            type: "object",
            required: [ "@id", "@type" ],
            properties: {
              "@id": { type: "string" },
              "@type": { type: "string" }
            }
          }
        ],
      },
      selector: { $ref: makeSchemaUri("selector") },
      purpose: { type: "string" }
    }
  })

  /////////////////////////////////////////////
  // ANNOTATIONS
  // NOTE : annotations can define both painting and non-painting annotations.

  fastify.addSchema({
    $id: makeSchemaUri("annotationTarget"),
    anyOf: [
      // URI
      { type: "string" },
      // SpecificResource
      { $ref: makeSchemaUri("specificResource") }
    ]
  })

  fastify.addSchema({
    $id: makeSchemaUri("motivation"),
    anyOf: [
      { type: "string", enum: motivationValues },
      {
        type: "array",
        items : { type: "string", enum: motivationValues }
      },
    ],
  })

  fastify.addSchema({
    $id: makeSchemaUri("referencedBody"),
    type: "object",
    required: [ "@id", "@type" ],
    properties: {
      "@id": { type: "string" },
      "@type": { type: "string" },  // should match `dctypes:[a-zA-Z]+`. regex is disabled for performance reasons.
      "format": { type: "string" }  // should be a MimeType.
    },
  })

  // embedded textual body
  fastify.addSchema({
    $id: makeSchemaUri("embeddedBody"),
    type: "object",
    required: [ "@type", "chars" ],
    properties: {
      "@type": {
        anyOf: [
          {
            type: "string",
            enum: [ "oa:TextualBody", "cnt:ContentAsText", "dctypes:Text" ]
          },
          {
            type: "array",
            items: {
              type: "string",
              enum: [ "oa:TextualBody", "cnt:ContentAsText", "dctypes:Text" ]
            }
          },
        ]
      },
      "format": { type: "string" },  // should be a MimeType
      "chars": { type: "string" }
    }
  })

  fastify.addSchema({
    $id: makeSchemaUri("body"),
    type: "object",
    anyOf: [
      { $ref: makeSchemaUri("embeddedBody") },
      { $ref: makeSchemaUri("referencedBody") },
    ]
  })

  fastify.addSchema({
    $id: makeSchemaUri("annotation"),
    type: "object",
    required: [ "@id", "@context", "@type", "motivation", "on" ],
    properties: {
      "@id": { type: "string" },
      "@context": { $ref: makeSchemaUri("context") },
      "@type": { type: "string", enum: [ "oa:Annotation" ] },
      motivation: { $ref: makeSchemaUri("motivation") },
      on: { $ref: makeSchemaUri("annotationTarget") },
      // in OA, one OR the other should be use, but `oneOf` can't be used in `properties`.
      resource: { $ref: makeSchemaUri("body") },
      bodyValue: { type: "string" }
    }
  });

  fastify.addSchema({
    $id: makeSchemaUri("annotationList"),
    type: "object",
    required: ["@id", "@type", "@context", "resources"],
    properties: {
      "@id": { type: "string" },
      "@context": { $ref: makeSchemaUri("context") },
      "@type": {
        type: "string",
        enum: [ "sc:AnnotationList" ]
      },
      "resources": {
        type: "array",
        items: { $ref: makeSchemaUri("annotation") }
      }
    }
  });

  // NOTE : not sure it's needed.
  fastify.addSchema({
    $id: makeSchemaUri("annotationArray"),
    type: "array",
    items: { $ref: makeSchemaUri("annotation") }
  })

  /////////////////////////////////////////////
  // MANIFESTS

  // internal data model for IIIF manifests, containing just what we need.
  // manifests are just stored as an @id, a short ID, an array of canvas Ids. we don't need more info.
  fastify.addSchema({
    $id: makeSchemaUri("manifestMongo"),
    type: "object",
    required: ["@id", "manifestShortId", "canvasIds"],
    properties: {
      "@id": { type: "string" },
      manifestShortId: { type: "string" },
      canvasIds: { type: "array", items: { type: "string" }}
    }
  })

  // minimal structure we need to work with a IIIF 2.x manifest.
  fastify.addSchema({
    $id: makeSchemaUri("manifestPublic"),
    type: "object",
    required: ["@id", "sequences"],
    properties: {
      "@id": { type: "string" },
      sequences: {
        type: "array",
        items: {
          type: "object",
          required: [ "@id", "canvases" ],
          properties: {
            "@id": { type: "string" },
            canvases: {
              type: "array",
              items: {
                type: "object",
                required: [ "@id" ],
                properties: {
                  "@id": { type: "string" }
                }
              }
            }
          }
        }
      }
    }
  })

  /////////////////////////////////////////////
  // COLLETION

  fastify.addSchema({
    $id: makeSchemaUri("collection"),
    type: "object",
    required: [ "@id", "@type", "@context", "members" ],
    properties: {
      "@context": { $ref: makeSchemaUri("context") },
      "@type": { type: "string", enum: [ "sc:Collection" ] },
      "@id": { type: "string" },
      label: { type: "string" },
      members: {
        type: "array",
        items: {
          type: "object",
          required: ["@id"],
          properties: {
            "@id": { type: "string" },
            "@type": { type: "string", enum: [ "sc:Manifest" ] },
          }
        }
      }
    }
  });

  /////////////////////////////////////////////
  // DONE


  fastify.decorate("schemasPresentation2", {
    makeSchemaUri: makeSchemaUri,
    getSchema: (slug) => getSchema(fastify, slug)
  })

  done();
}





export default fastifyPlugin(addSchemas)