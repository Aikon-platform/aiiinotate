/**
 * schemas for routes. these schemas are more permissive than the database schemas, defined for example in `presentation2`.
 */

import fastifyPlugin from "fastify-plugin";

/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */


/** @param {string} slug */
const makeSchemaUri = (slug) =>
  `${process.env.AIIINOTATE_BASE_URL}/schemas/routes/${slug}`;

/**
 * @param {FastifyInstanceType} fastify
 * @param {"search"|"presentation"} slug
 */
const getSchema = (fastify, slug) =>
  fastify.getSchema(makeSchemaUri(slug));


/**
 *
 * @param {FastifyInstanceType} fastify
 * @param {object?} options
 * @param {function} done
 */
function addSchemas(fastify, options, done) {

  ////////////////////////////////////////////////////////
  // ANNOTATIONS ROUTES

  fastify.addSchema({
    $id: makeSchemaUri("routeAnnotation2"),
    type: "object",
    required: [ "@id", "@type", "motivation", "on" ],
    properties: {
      "@id": { type: "string" },
      "@type": { type: "string" },
      motivation: { anyOf: [
        { type: "string", enum: [ "oa:Annotation" ] },
        { type: "array", items: { type: "string" }}
      ]},
      on: {
        anyOf: [
          { type: "string" },
          { type: "object" },
          {
            type: "array",
            items: { anyOf: [
              { type: "string" },
              { type: "object" }
            ]},
            minItems: 1
          }
        ]
      }
    }
  });

  fastify.addSchema({
    $id: makeSchemaUri("routeAnnotation3"),
    type: "object",
    required: [ "id", "type", "motivation", "target" ],
    properties: {
      id: { type: "string" },
      type: { type: "string", enum: ["Annotation"] },
      motivation: { anyOf: [
        { type: "string" },
        { type: "array", items: { type: "string" } },
      ]},
      target: {
        anyOf: [
          { type: "string" },
          { type: "object" },
          {
            type: "array",
            items: { anyOf: [
              { type: "string" },
              { type: "object" }
            ]},
            minItems: 1
          }
        ]
      }
    }
  })

  fastify.addSchema({
    $id: makeSchemaUri("routeAnnotation2Or3"),
    anyOf: [
      { $ref: makeSchemaUri("routeAnnotation2") },
      { $ref: makeSchemaUri("routeAnnotation3") }
    ]
  });

  fastify.addSchema({
    $id: makeSchemaUri("routeAnnotationListOrPageUri"),
    type: "object",
    required: ["uri"],
    properties: {
      "uri": { type: "string" },
    }
  });

  fastify.addSchema({
    $id: makeSchemaUri("routeAnnotationListOrPageUriArray"),
    type: "array",
    items: { $ref: "routeAnnotationListOrPageUri" }
  });

  fastify.addSchema({
    $id: makeSchemaUri("routeAnnotationList"),
    type: "object",
    required: ["@id", "@type", "resources"],
    properties: {
      "@context": { type: "string" },  // i don't specify the value because @context may be an URI that points to a JSON that contains several namespaces other than "http://iiif.io/api/presentation/2/context.json"
      "@id": { type: "string" },
      "@type": { type: "string", enum: ["sc:AnnotationList"] },
      "resources": {
        type: "array",
        items: { $ref: makeSchemaUri("routeAnnotation2") }
      }
    }
  })

  fastify.addSchema({
    $id: makeSchemaUri("routeAnnotationPage"),
    type: "object",
    required: ["@id", "@type", "items"],
    properties: {
      "@context": { type: "string" },  // i don't specify the value because @context may be an URI that points to a JSON that contains several namespaces other than "http://iiif.io/api/presentation/2/context.json"
      "id": { type: "string" },
      "type": { type: "string", enum: ["AnnotationPage"] },
      "items": {
        type: "array",
        items: { $ref: makeSchemaUri("routeAnnotation3") }
      }
    }
  });

  fastify.addSchema({
    $id: makeSchemaUri("routeAnnotationListArray"),
    type: "array",
    items: { $ref: makeSchemaUri("routeAnnotationList") }
  });

  fastify.addSchema({
    $id: makeSchemaUri("routeAnnotationPageArray"),
    type: "array",
    items: { $ref: makeSchemaUri("routeAnnotationPage") }
  })

  fastify.addSchema({
    $id: makeSchemaUri("routeAnnotationCreateMany"),
    anyOf: [
      { $ref: makeSchemaUri("routeAnnotationList") },
      { $ref: makeSchemaUri("routeAnnotationPage") },
      { $ref: makeSchemaUri("routeAnnotationListArray") },
      { $ref: makeSchemaUri("routeAnnotationPageArray") },
      { $ref: makeSchemaUri("routeAnnotationListOrPageUri") },
      { $ref: makeSchemaUri("routeAnnotationListOrPageUriArray") },
    ]
  })

  fastify.addSchema({
    $id: makeSchemaUri("routeAnnotationDelete"),
    oneOf: [
      {
        type: "object",
        required: ["uri"],
        properties: { uri: { type: "string", description: "delete the annotation with this '@id'" } }
      },
      {
        type: "object",
        required: ["manifestShortId"],
        properties: { manifestShortId: { type: "string", description: "delete all annotations for a single manifest" } }
      },
      {
        type: "object",
        required: ["canvasUri"],
        properties: { canvasUri: { type: "string", description: "delete all annotations for a single canvas" } }
      }
    ]
  })

  ////////////////////////////////////////////////////////
  // MANIFESTS ROUTES

  fastify.addSchema({
    $id: makeSchemaUri("routeManifest2Or3"),
    anyOf: [
      {
        type: "object",
        required: ["uri"],
        properties: { uri: { type: "string" } }
      },
      { $ref: fastify.schemasPresentation2.makeSchemaUri("manifestPublic") },
      { $ref: fastify.schemasPresentation3.makeSchemaUri("manifestPublic") },
    ]
  });

  fastify.addSchema({
    $id: makeSchemaUri("routeManifestDelete"),
    type: "object",
    oneOf: [
      {
        type: "object",
        required: ["uri"],
        properties: { uri: { type: "string" } }
      },
      {
        type: "object",
        required: ["manifestShortId"],
        properties: { manifestShortId: { type: "string" } }
      }
    ]
  });

  ////////////////////////////////////////////////////////
  // GENERIC STUFF

  fastify.addSchema({
    $id: makeSchemaUri("routeDelete"),
    type: "object",
    oneOf: [
      { $ref: makeSchemaUri("routeAnnotationDelete") },
      { $ref: makeSchemaUri("routeManifestDelete") },
    ]
  });

  fastify.addSchema({
    $id: makeSchemaUri("routeResponseInsert"),
    type: "object",
    required: [ "insertedCount" ],
    properties: {
      insertedCount: { type: "integer", minimum: 0 },
      insertedIds: {
        type: "array",
        items: { type: "string" }
      },
      preExistingIds: {
        type: "array",
        items: { type: "string" }
      },
      fetchErrorIds: {
        type: "array",
        items: { type: "string" }
      },
      rejectedIds: {
        type: "array",
        items: { type: "string" }
      }
    }
  });

  fastify.addSchema({
    $id: makeSchemaUri("routeResponseUpdate"),
    type: "object",
    required: ["matchedCount", "modifiedCount", "upsertedCount"],
    properties: {
      matchedCount: { type: "integer" },
      modifiedCount: { type: "integer" },
      upsertedCount: { type: "integer" },
      upsertedId: { type: [ "string", "null" ] }  // string|null => the field is nullable !
    }
  });

  fastify.addSchema({
    $id: makeSchemaUri("routeResponseDelete"),
    type: "object",
    required: [ "deletedCount" ],
    properties: {
      deletedCount: { type: "integer", minimum: 0 }
    }
  });

  fastify.addSchema({
    $id: makeSchemaUri("routeResponseError"),
    type: "object",
    required: [],// [ "message", "info", "method", "url" ],
    properties: {
      message: { type: "string" },
      info: {},  // only using `{}` equates to JS "Any" type
      method: { type: "string" },
      url: { type: "string" },
      requestBody: {}
    }
  });

  ////////////////////////////////////////////////////////

  fastify.decorate("schemasRoutes", {
    makeSchemaUri: makeSchemaUri,
    getSchema: (slug) => getSchema(fastify, slug)
  });

  done();
}


export default fastifyPlugin(addSchemas);

