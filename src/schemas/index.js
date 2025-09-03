import fastifyPlugin from "fastify-plugin";

import baseSchemas from "#src/schemas/base.js";
import presentation2Schemas from "#src/schemas/presentation2.js";


function schemas(fastify, options, done) {

  fastify.register(baseSchemas);
  fastify.register(presentation2Schemas);

  done()
}

export default fastifyPlugin(schemas);