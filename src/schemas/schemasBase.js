/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */

function addSchemas(fastify, makeSchemaUri) {
  fastify.addSchema({
    $id: makeSchemaUri("presentation"),
    type: "integer",
    enum: [2, 3],
    description: "IIIF presentation API versions"
  });
  fastify.addSchema({
    $id: makeSchemaUri("search"),
    type: "integer",
    enum: [1, 2],
    description: "IIIF search API versions"
  });
  return fastify
}

export default addSchemas;
