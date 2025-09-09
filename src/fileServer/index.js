/**
 * the `fileServer` plugin makes test files available to the entire fastify app, mostly for testing purposes.
 */
import url from "url";
import path from "path";
import fsPromises from "fs/promises";

import fastifyPlugin from "fastify-plugin";

import { uriData, uriDataArray, annotationList, annotationListArray, uriDataArrayInvalid } from "#fileServer/annotationsCreate.js";
import annotations2Invalid from "#fileServer/annotations2Invalid.js";
import annotations2Valid from "#fileServer/annotations2Valid.js";


// path to dirctory of curent file
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");

/**
 * NOTE: `done` musn't be used with async plugins. it raises an error `FST_ERR_PLUGIN_INVALID_ASYNC_HANDLER`
 * @param {import('fastify').FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {object} options
 */
async function fileServer(fastify, options) {

  const availableFiles = await fsPromises.readdir(dataDir);

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
    async (request, reply) => {
      const { fileName } = request.params;
      if ( !availableFiles.includes(fileName) ) {
        throw new Error(`file not found: ${fileName}`);
      }
      return await fsPromises.readFile(path.join(dataDir, fileName), { encoding: "utf8" })
    }
  )

  fastify.decorate("fileServer", {
    uriData: uriData,
    uriDataArray: uriDataArray,
    annotationList: annotationList,
    annotationListArray: annotationListArray,
    uriDataArrayInvalid: uriDataArrayInvalid,
    annotations2Invalid: annotations2Invalid,
    annotations2Valid: annotations2Valid,
  });
}

export default fastifyPlugin(fileServer);