/**
 * the `fileServer` plugin makes test files available to the entire fastify app, mostly for testing purposes.
 */
import fastifyPlugin from "fastify-plugin";

import { annotations2Invalid, annotations2Valid, annotationListUri, annotationListUriArray, annotationList, annotationListArray, annotationListUriInvalid, annotationListUriArrayInvalid } from "#src/fileServer/annotations.js";
import { readFileToObject } from "#fileServer/utils.js";

/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */


/**
 * NOTE: `done` musn't be used with async plugins. it raises an error `FST_ERR_PLUGIN_INVALID_ASYNC_HANDLER`
 * @param {FastifyInstanceType} fastify  Encapsulated Fastify Instance
 * @param {object} options
 */
async function fileServer(fastify, options) {

  /** route to return a file in `dataDir` */
  fastify.get(
    "/fileServer/:fileName",
    {
      schema: {
        params: {
          type: "object",
          properties: { fileName: { type: "string" } }
        }
      },
      response: {
        200: {
          type: "string"
        },
        500: {
          type: "object",
          properties: {
            error: { type: "string" }
          }
        }
      }
    },
    (request, reply) => {
      const { fileName } = request.params;
      return readFileToObject(fileName);
    }
  )

  fastify.decorate("fileServer", {
    annotationListUri: annotationListUri,
    annotationListUriArray: annotationListUriArray,
    annotationList: annotationList,
    annotationListArray: annotationListArray,
    annotationListUriArrayInvalid: annotationListUriArrayInvalid,
    annotationListUriInvalid: annotationListUriInvalid,
    annotations2Invalid: annotations2Invalid,
    annotations2Valid: annotations2Valid,
  });
}

export default fastifyPlugin(fileServer);