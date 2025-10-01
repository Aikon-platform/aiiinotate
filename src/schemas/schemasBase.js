import fastifyPlugin from "fastify-plugin"

/** @typedef {import("#data/types.js").FastifyInstanceType} FastifyInstanceType */

/** @param {"search"|"presentation"} slug */
const makeSchemaUri = (slug) =>
  `${process.env.APP_BASE_URL}/schemas/${slug}/version`;

/**
 * @param {FastifyInstanceType} fastify
 * @param {"search"|"presentation"} slug
 */
const getSchema = (fastify, slug) =>
  fastify.getSchema(makeSchemaUri(slug));

function addSchemas(fastify, options, done) {

  // fastify.decorate("makeSchemaUri", makeSchemaUri);
  // fastify.decorate("getSchema", (slug) => getSchema(fastify, slug));

  // schemas are defined on the global `fastify` instance
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

  // functions `makeSchemaUri` and `getSchema`
  // are defined in an object that is used to decorate the global `fastify` instance,
  // this namespacing the functions and allowing each plugin
  // in this module to have functions with the same name.
  fastify.decorate("schemasBase", {
    makeSchemaUri: makeSchemaUri,
    getSchema: (slug) => getSchema(fastify, slug)
  }) ;

  done()
}

export default fastifyPlugin(addSchemas);
