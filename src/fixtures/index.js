/**
 * the `fixtures` plugin makes test files available to the entire fastify app, mostly for testing purposes.
 */
import fastifyPlugin from "fastify-plugin";

import { annotations2Invalid, annotations2Valid, annotationListUri, annotationListUriArray, annotationList, annotationListArray, annotationListUriInvalid, annotationListUriArrayInvalid } from "#src/fixtures/annotations.js";
import { manifest2Valid, manifest2ValidUri, manifest2Invalid, manifest2InvalidUri } from "#fixtures/manifests.js";
import { generateIiif2Manifest, generateIiif2AnnotationList, generateIiif2ManifestAndAnnotationsList } from "#fixtures/generate.js";
import { readFileToObject } from "#fixtures/utils.js";

/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */


/**
 * NOTE: `done` musn't be used with async plugins. it raises an error `FST_ERR_PLUGIN_INVALID_ASYNC_HANDLER`
 * @param {FastifyInstanceType} fastify  Encapsulated Fastify Instance
 * @param {object} options
 */
async function fixtures(fastify, options) {

  /** route to return a file in `dataDir` */
  fastify.get(
    "/fixtures/:fileName",
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
    async (request, reply) => {
      const { fileName } = request.params;
      return readFileToObject(fileName);
    }
  )

  fastify.decorate("fixtures", {
    annotationListUri: annotationListUri,
    annotationListUriArray: annotationListUriArray,
    annotationList: annotationList,
    annotationListArray: annotationListArray,
    annotationListUriArrayInvalid: annotationListUriArrayInvalid,
    annotationListUriInvalid: annotationListUriInvalid,
    annotations2Invalid: annotations2Invalid,
    annotations2Valid: annotations2Valid,
    manifest2Valid: manifest2Valid,
    manifest2ValidUri: manifest2ValidUri,
    manifest2Invalid: manifest2Invalid,
    manifest2InvalidUri: manifest2InvalidUri,
    generateIiif2Manifest: generateIiif2Manifest,
    generateIiif2AnnotationList: generateIiif2AnnotationList,
    generateIiif2ManifestAndAnnotationsList: generateIiif2ManifestAndAnnotationsList
  });
}

export default fastifyPlugin(fixtures);