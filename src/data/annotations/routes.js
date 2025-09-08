import fastifyPlugin from "fastify-plugin"

import { pathToUrl, objectHasKey, maybeToArray } from "#data/utils/utils.js";

/**
 * Encapsulates the routes
 * @param {import('fastify').FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://fastify.dev/docs/latest/Reference/Plugins/#plugin-options
 */
async function annotationsRoutes (fastify, options) {
  const
    { annotations2, annotations3 } = options,
    iiifPresentationApiVersion = fastify.schemasBase.getSchemaByUri("presentation");

  /** get all annotations by a canvas URI */
  fastify.get(
    "/annotations/:iiifPresentationVersion/search",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            iiifPresentationVersion: iiifPresentationApiVersion// iiifPresentationApiVersion
          }
        },
        querystring: {
          type: "object",
          properties: {
            uri: { type: "string" },
            asAnnotationList: { type: "boolean" },
          }
        },
      },
    },
    async (request, reply) => {
      const
        queryUrl = pathToUrl(request.url),
        { iiifPresentationVersion } = request.params,
        { uri, asAnnotationList } = request.query;

      if ( iiifPresentationVersion === 2 ) {
        const res = annotations2.findFromCanvasUri(queryUrl, uri, asAnnotationList);
        return res;
      } else {
        annotations3.notImplementedError();
      }
    }
  );

  /**
   * create many annotations from:
   * - an annotationList (if iiifPresentationVersion === 2)
   * - an annotationPage (if iiifPresentationVersion === 3)
   * - an URI to an annotationList or annotationPage
   * - or an Array of any of the previous
   */
  fastify.post(
    "/annotations/:iiifPresentationVersion/createMany",
    {
      schema: {
        body: {
          anyOf: [
            // URI
            {
              $id: "annotationUri",
              type: "object",
              required: [ "uri" ],
              properties: {
                "uri": { type: "string" },
              }
            },
            // array of URIs
            {
              $id: "annotationUriArray",
              type: "array",
              items: [ { $ref: "annotationUri" } ]
            },
            // annotationList
            {
              $id: "annotationList",
              type: "object",
              required: [ "@id", "@type", "resources" ],
              properties: {
                "@context": { type: "string" },  // i don't specify the value because @context may be an URI that points to a JSON that contains several namespaces other than "http://iiif.io/api/presentation/2/context.json"
                "@id": { type: "string" },
                "@type": { type: "string", enum: ["sc:AnnotationList"] },
                "resources": { type: "array", items: { type: "object" } }
              }
            },
            // annotationPage
            {
              $id: "annotationPage",
              type: "object",
              required: [ "@id", "@type", "resources" ],
              properties: {
                "@context": { type: "string" },  // i don't specify the value because @context may be an URI that points to a JSON that contains several namespaces other than "http://iiif.io/api/presentation/2/context.json"
                "id": { type: "string" },
                "type": { type: "string", enum: ["AnnotationPage"] },
                "items": { type: "array", items: { type: "object" } }
              }
            },
            // array of anotationLists
            {
              $id: "annotationListArray",
              type: "array",
              items: [ { $ref: "annotationList" } ]
            },
            // array of annotationPages
            {
              $id: "annotationPageArray",
              type: "array",
              items: [ { $ref: "annotationPage" } ]
            }
          ]
        }
      }
    },
    async (request, reply) => {
      const
        queryUrl = pathToUrl(request.url),
        { iiifPresentationVersion } = request.params,
        body = maybeToArray(request.body),  // convert to an array to have a homogeneous data structure
        mode = {
          version: undefined,  // IIIF presentation version of the data (must match `:iiifPresentationVersion`)
          asUri: undefined,  // data was passed as `annotationUri` or `annotationUriArray`
        };

      // data to actually insert (body with resolved URIs, if the body contains any.)
      let annotationsArray = [];

      // 1. detect the type of body received.
      mode.asUri = body.find(item => objectHasKey(item, "uri"));
      console.log("xxxxxxxx", mode.asUri);

      // 2. fetch objects if we received `annotationUri` or `annotationUriArray`
      if ( mode.asUri ) {
        annotationsArray = await Promise.all(
          body.map(async (item) => {
            await fetch(item.uri);
          })
        )
      } else {
        annotationsArray = body;
      }

      // 3. validate (if it's an annotationList but `iiifPresentationVersion===3`, raise)
      annotationsArray;

      // 4. insert
    }
  )

  /** create a single annotation from an annotation object */
  fastify.post(
    "/annotations/:iiifPresentationVersion/create",
    {
      schema: {
        // ...
      }
    },
    async (request, reply) => {

    }
  )


}

export default fastifyPlugin(annotationsRoutes);
