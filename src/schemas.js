import fastifyPlugin from "fastify-plugin"

function addSchemas(fastify, options, done) {
  fastify.addSchema({
    $id: "iiifPresentationApiVersion",
    type: "integer",
    enum: [2, 3],
    description: "IIIF presentation API versions"
  });
  fastify.addSchema({
    $id: "iiifSearchApiVersion",
    type: "integer",
    enum: [1, 2],
    description: "IIIF search API versions"
  });
  done()
}

export default fastifyPlugin(addSchemas);
