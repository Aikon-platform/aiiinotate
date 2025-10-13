import fastifyPlugin from "fastify-plugin";

import schemasBase from "#src/schemas/schemasBase.js";
import schemasPresentation2 from "#src/schemas/schemasPresentation2.js";
import schemasPresentation3 from "#src/schemas/schemasPresentation3.js";
import schemasResolver from "#schemas/schemasResolver.js";
import schemasRoutes from "#src/schemas/schemasRoutes.js";

function schemas(fastify, options, done) {

  fastify.register(schemasResolver);
  fastify.register(schemasBase);
  fastify.register(schemasPresentation2);
  fastify.register(schemasPresentation3);
  fastify.register(schemasRoutes);

  done()
}

export default fastifyPlugin(schemas);