import fastifyPlugin from "fastify-plugin"

import { pathToUrl, objectHasKey, maybeToArray, inspectObj } from "#data/utils/utils.js";

/**
 * if obj[typeKey] !== expectedTypeVal, throw
 * @param {object} obj
 * @param {2|3} iiifPresentationVersion
 * @param {string|number} typeKey
 * @param {any} expectedTypeVal
 */
const throwIfValueError = (obj, typeKey, expectedTypeVal) => {
  if ( obj[typeKey] !== expectedTypeVal ) {
    throw new Error(`expected value '${expectedTypeVal}' for key '${typeKey}', got: '${obj[typeKey]}' in object ${inspectObj(obj)}`);
  };
}

/**
 * if obj[key] is undefined, throw
 * @param {object} obj
 * @param {string|number} key
 */
const throwIfKeyUndefined = (obj, key) => {
  if ( !objectHasKey(obj, key) ) {
    throw new Error(`key '${key}' not found in object ${inspectObj(obj)}`);
  }
}

/**
 * validate an annotation, annotationPage or annotationList: that is, ensure it fits the IIIF presentation API
 * @param {2|3} iiifPresentationVersion
 * @param {object} annotationData
 * @param {boolean} isListOrPage: it's an annotationList or annotationPage instead of a regular annotation.
 */
const validateAnnotationVersion = (iiifPresentationVersion, annotationData, isListOrPage=false) => {
  // object keys are always strings, so we need to convert to string (https://stackoverflow.com/questions/3633362)
  iiifPresentationVersion = iiifPresentationVersion.toString();
  const expectedTypeKeys = {
    "2": "@type",
    "3": "type"
  };
  throwIfKeyUndefined(expectedTypeKeys, iiifPresentationVersion);
  const expectedTypeKey = expectedTypeKeys[iiifPresentationVersion];
  throwIfKeyUndefined(annotationData, expectedTypeKey);
  const expectedTypeVal = (
    isListOrPage
      ? { "2": "sc:AnnotationList", "3":"AnnotationPage"}
      : { "2": "oa:Annotation", "3": "Annotation" }
  )[iiifPresentationVersion];
  throwIfValueError(annotationData, expectedTypeKey, expectedTypeVal);
}

/**
 * `annotationArray` is an array of AnnotationLists or AnnotationPages, depending on the IIIF Presentaion API version.
 * assert that it indeed the case, raise otherwise
 * @param {2|3} iiifPresentationVersion
 * @param {object[]} annotationArray
 * @returns {void}
 */
const validateAnnotationArrayVersion = (iiifPresentationVersion, annotationArray) =>
  annotationArray.map(annotationData => validateAnnotationVersion(iiifPresentationVersion, annotationData, true));

/**
 *
 * @param {import("fastify").FastifyRequest} request
 * @param {import("fastify").FastifyReply} reply
 * @param {Error} err: the error we're returning
 * @param {any?} data: the data on which the error occurred, for POST requests
 */
const returnError = (request, reply , err, data) => {
  const error = {
    message: `failed ${request.method.toLocaleUpperCase()} request because of error: ${err.message}`,
    info: err.info || {},
    method: request.method,
    url: request.url
  };
  if ( data !== undefined ) {
    error.inputData = data
  }
  reply
    .status(500)
    .header("Content-Type", "application/json; charset=utf-8")
    .send(error);
}

/**
 * @param {import("#data/types.js").InsertResponseArrayType} insertResponseArray
 * @returns {import("#data/types.js").InsertResponseType}
 */
const reduceinsertResponseArray = (insertResponseArray) => ({
  insertedCount: insertResponseArray.reduce((acc, r) => acc+r.insertedCount, 0),
  insertedIds: insertResponseArray.reduce((acc, r) => acc.concat(r.insertedIds), [])
})

/**
 * Encapsulates the routes
 * @param {import('fastify').FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://fastify.dev/docs/latest/Reference/Plugins/#plugin-options
 */
async function annotationsRoutes(fastify, options) {
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
            iiifPresentationVersion: iiifPresentationApiVersion
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

      try {
        if (iiifPresentationVersion === 2) {
          const res = annotations2.findFromCanvasUri(queryUrl, uri, asAnnotationList);
          return res;
        } else {
          annotations3.notImplementedError();
        }
      } catch (err) {
        returnError(request, reply, err);
      }
    }
  );

  /**
   * create several annotations from:
   * - an annotationList (if iiifPresentationVersion === 2)
   * - an annotationPage (if iiifPresentationVersion === 3)
   * - an URI to an annotationList or annotationPage
   * - or an Array of any of the previous
   *
   * note that POST body size is limited to 1MB, so your query might be rejected. body size is limited by:
   * - fastify's `bodyLimit` (https://fastify.dev/docs/latest/Reference/Server/#bodylimit)
   * - nginx's `client_max_body_size` (https://nginx.org/en/docs/http/ngx_http_core_module.html#client_max_body_size)
   * - any other server's max body size.
   * both fastify and nginx limit body size defaults to to 1MB.
   */
  fastify.post(
    "/annotations/:iiifPresentationVersion/createMany",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            iiifPresentationVersion: iiifPresentationApiVersion
          }
        },
        body: {
          anyOf: [
            // URI
            {
              $id: "annotationUri",
              type: "object",
              required: ["uri"],
              properties: {
                "uri": { type: "string" },
              }
            },
            // array of URIs
            {
              $id: "annotationUriArray",
              type: "array",
              items: [{ $ref: "annotationUri" }]
            },
            // annotationList
            {
              $id: "annotationList",
              type: "object",
              required: ["@id", "@type", "resources"],
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
              required: ["@id", "@type", "resources"],
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
              items: [{ $ref: "annotationList" }]
            },
            // array of annotationPages
            {
              $id: "annotationPageArray",
              type: "array",
              items: [{ $ref: "annotationPage" }]
            }
          ]
        }
      }
    },
    async (request, reply) => {
      const
        { iiifPresentationVersion } = request.params,
        body = maybeToArray(request.body),  // convert to an array to have a homogeneous data structure
        insertResponseArray = [];

      // data to actually insert (body with resolved URIs, if the body is  `annotationUri` or `annotationUriArray`)
      let annotationsArray = [];

      try {
        // if we received `annotationUri` or `annotationUriArray`, fetch objects
        const asUri = body.find(item => objectHasKey(item, "uri")) !== undefined;
        if (asUri) {
          annotationsArray = await Promise.all(
            body.map(async (item) =>
              fetch(item.uri).then(r => r.json()))
          );
        } else {
          annotationsArray = body;
        }

        validateAnnotationArrayVersion(iiifPresentationVersion, annotationsArray);

        // insert
        if ( iiifPresentationVersion === 2 ) {
          await Promise.all(annotationsArray.map(
            async (annotationList) => {
              const r = await annotations2.insertAnnotationList(annotationList);
              insertResponseArray.push(r);
            }
          ));
          return reduceinsertResponseArray(insertResponseArray);
        } else {
          annotations3.notImplementedError();
        }

      } catch (err) {
        returnError(request, reply, err, request.body);
      }
    }
  )

  /** create a single annotation from an annotation object */
  fastify.post(
    "/annotations/:iiifPresentationVersion/create",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            iiifPresentationVersion: iiifPresentationApiVersion
          }
        },
        body: {
          type: "object",
          required: [ "@id", "@type", "motivation" ],
          properties: {
            "@id": { type: "string" },
            "@type": { type: "string" },
            "motivation": { anyOf: [
              { type: "string", enum: [ "oa:Annotation" ] },
              { type: "array", items: { type: "string" }}
            ]}
          }
        }
      }
    },
    async (request, reply) => {
      const
        { iiifPresentationVersion } = request.params,
        annotation = request.body;

      try {
        validateAnnotationVersion(iiifPresentationVersion, annotation);
        // insert
        if ( iiifPresentationVersion === 2 ) {
          const r = await annotations2.insertAnnotation(annotation);
          return r;
        } else {
          annotations3.notImplementedError();
        }

      } catch (err) {
        returnError(request, reply, err, request.body);
      }
    }
  )
}

export default fastifyPlugin(annotationsRoutes);
