import fastifyPlugin from "fastify-plugin"

import { pathToUrl, objectHasKey, maybeToArray, inspectObj, throwIfKeyUndefined, throwIfValueError, getFirstNonEmptyPair, visibleLog } from "#utils/utils.js";
import { makeResponseSchema, makeResponsePostSchema, returnError } from "#utils/routeUtils.js";


/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */
/** @typedef {import("#types").Annotations2InstanceType} Annotations2InstanceType */
/** @typedef {import("#types").Annotations3InstanceType} Annotations3InstanceType */

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
 * @param {import("#types").InsertResponseArrayType} insertResponseArray
 * @returns {import("#types").InsertResponseType}
 */
const reduceInsertResponseArray = (insertResponseArray) => ({
  insertedCount: insertResponseArray.reduce((acc, r) => acc+r.insertedCount, 0),
  insertedIds: insertResponseArray.reduce((acc, r) => acc.concat(r.insertedIds), [])
})


/**
 * Encapsulates the routes
 * @param {FastifyInstanceType} fastify  Encapsulated Fastify Instance
 * @param {object} options plugin options, refer to https://fastify.dev/docs/latest/Reference/Plugins/#plugin-options
 * @param {Function} done
 */
function annotationsRoutes(fastify, options, done) {
  const
    /** @type {Annotations2InstanceType} */
    annotations2 = fastify.annotations2,
    /** @type {Annotations3InstanceType} */
    annotations3 = fastify.annotations3,
    iiifPresentationVersionSchema = fastify.schemasBase.getSchema("presentation"),
    routeAnnotation2Or3Schema = fastify.schemasRoutes.getSchema("routeAnnotation2Or3"),
    routeAnnotationCreateManySchema = fastify.schemasRoutes.getSchema("routeAnnotationCreateMany"),
    iiifAnnotationListSchema = fastify.schemasPresentation2.getSchema("annotationList"),
    iiifAnnotation2ArraySchema = fastify.schemasPresentation2.getSchema("annotationArray"),
    iiifAnnotation2Schema = fastify.schemasPresentation2.getSchema("annotation"),
    responsePostSchema = makeResponsePostSchema(fastify);

  /////////////////////////////////////////////////////////
  // get routes

  /** get all annotations by a canvas URI */
  fastify.get(
    "/annotations/:iiifPresentationVersion/search",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            iiifPresentationVersion: iiifPresentationVersionSchema
          }
        },
        querystring: {
          type: "object",
          properties: {
            uri: { type: "string" },
            asAnnotationList: { type: "boolean" },
          }
        },
        response: makeResponseSchema(
          fastify,
          {
            oneOf: [
              fastify.schemasResolver(iiifAnnotationListSchema),
              fastify.schemasResolver(iiifAnnotation2ArraySchema)
            ]
          },
        )
      },
    },
    async (request, reply) => {
      const
        queryUrl = pathToUrl(request.url),
        { iiifPresentationVersion } = request.params,
        { uri, asAnnotationList } = request.query;

      try {
        if (iiifPresentationVersion === 2) {
          return await annotations2.findByCanvasUri(queryUrl, uri, asAnnotationList);
        } else {
          annotations3.notImplementedError();
        }
      } catch (err) {
        returnError(request, reply, err);
      }
    }
  );

  /** retrieve a single annotation by its "@id"|"id". this route defers an annotation */
  fastify.get(
    "/data/:iiifPresentationVersion/:manifestShortId/annotation/:annotationShortId",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            iiifPresentationVersion: iiifPresentationVersionSchema,
            manifestShortId: { type: "string" },
            annotationShortId: { type: "string" },
          }
        },
        response: makeResponseSchema(
          fastify,
          fastify.schemasResolver(iiifAnnotation2Schema)
        )
      }
    },
    async (request, reply) => {
      const
        annotationUri = pathToUrl(request.url),
        { iiifPresentationVersion} = request.params;
      try {
        return iiifPresentationVersion === 2
          ? annotations2.findById(annotationUri)
          : annotations3.notImplementedError();
      } catch (err) {
        returnError(request, reply, err);
      }
    }
  )

  /////////////////////////////////////////////////////////
  // create/update routes

  /** create or update a single annotation from an annotation object */
  fastify.post(
    "/annotations/:iiifPresentationVersion/:action",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            iiifPresentationVersion: iiifPresentationVersionSchema,
            action: { type: "string", enum: [ "create", "update" ] }
          }
        },
        body: routeAnnotation2Or3Schema,
        response: responsePostSchema
      },
    },
    async (request, reply) => {
      const
        { iiifPresentationVersion, action } = request.params,
        annotation = request.body;

      try {
        validateAnnotationVersion(iiifPresentationVersion, annotation);
        // insert or update
        if ( iiifPresentationVersion === 2 ) {
          return action==="create"
            ? await annotations2.insertAnnotation(annotation)
            : await annotations2.updateAnnotation(annotation);
        } else {
          annotations3.notImplementedError();
        }

      } catch (err) {
        returnError(request, reply, err, request.body);
      }
    }
  )

  /**
   * create several annotations from:
   * - an annotationList (if iiifPresentationVersion === 2)
   * - an annotationPage (if iiifPresentationVersion === 3)
   * - an URI to an annotationList or annotationPage
   * - or an Array of any of the previous
   *
   * NOTE that POST body size is limited to 1MB, so your query might be rejected. body size is limited by:
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
            iiifPresentationVersion: iiifPresentationVersionSchema
          }
        },
        body: routeAnnotationCreateManySchema,
        response: responsePostSchema
      }
    },
    async (request, reply) => {
      const
        { iiifPresentationVersion } = request.params,
        body = maybeToArray(request.body),  // convert to an array to have a homogeneous data structure
        insertResponseArray = [];

      // data to actually insert (body with resolved URIs, if the body is  `annotationListOrPageUri` or `annotationListOrPageUriArray`)
      let annotationsArray = [];

      try {
        // if we received `annotationListOrPageUri` or `annotationListOrPageUriArray`, fetch objects
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
          return reduceInsertResponseArray(insertResponseArray);
        } else {
          annotations3.notImplementedError();
        }

      } catch (err) {
        returnError(request, reply, err, request.body);
      }
    }
  )

  done();

}

export default fastifyPlugin(annotationsRoutes);
