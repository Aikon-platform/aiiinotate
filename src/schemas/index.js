import fastifyPlugin from "fastify-plugin";

import baseSchemas from "#schemas/base.js";
import presentation2Schemas from "#schemas/presentation2.js";
import schemasToMongo from "#schemas/schemasToMongo.js";

function schemas(fastify, options, done) {

  fastify.register(schemasToMongo);
  fastify.register(baseSchemas);
  fastify.register(presentation2Schemas);

  done()
}

export default fastifyPlugin(schemas);