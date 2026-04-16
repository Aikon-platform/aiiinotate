import fastifyPlugin from "fastify-plugin";

import addSchemasBase from "#schemas/schemasBase.js";
import addSchemasPresentation3 from "#schemas/schemasPresentation3.js";
import addSchemasPresentation2 from "#src/schemas/schemasPresentation2.js";
import addSchemasRoutes from "#schemas/schemasRoutes.js";
import schemasResolver from "#schemas/schemasResolver.js";
import { PUBLIC_URL } from "#constants";

/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */
/** @typedef {import("#types").FastifySchemaType} FastifySchemaType */

/**
 * NOTE : how are schemas managed in aiiinotate ?
 * we implement "namespaced schemas" (aka, schemas grouped together in a single fastify decorator).
 *
 * TLDR: schemas are added to the global fastify instance, but their IDs are namespaced;
 * schemas they are then accessed through decorators, each decorator is used to resolve annotations
 * within a namespace.
 *
 * @example
 *  > fastify.schemasPresentation2.getSchema("annotations") =>
 *  > // resolves to
 *  > fastify.getSchema("$PUBLIC_URL/schemas/schemasPresentation2/annotation")
 *
 * IN MORE DETAIL:
 * - namespacing is done through the IDs of the schemas, defined on `fastify.addSchema` and used
 *    to retrieve a schema with `fastify.getSchema()`
 * - the global schema ID anatomy is defined here, in `_makeSchemaUri`: it's an URI that
 *    accepts a "namespace". each schema has a unique `slug` appended to the end of the URI.
 * - each file in this module (appart from `schemasResolver` and this file) exports
 *    an `addSchemas` function that adds schemas to the global fastify instance with
 *    a specific namespace.
 * - then, a decorator is added to the fastify instance for each namespace. it adds 2 functions
 *    `getSchema` and `makeSchemaUri` that are used to resolve schemas names and to access
 *    all schemas within a certain namespace.
 * - thanks to that, schemas can be accessed by their unique slug with the pattern:
 *   `fastify.$schemaNamespace.getSchema($schemaSlug)`.
 * - schemas defined here are accessible in the entire fastify app.
 */

/**
 * @type {(namespace: string) => (slug: string) => string}
 */
const _makeSchemaUri = (namespace) =>
  (slug) => `${PUBLIC_URL}/schemas/${namespace}/${slug}`;

/**
 * @type {(fastify: FastifyInstanceType, namespace: string) => (slug: string) => FastifySchemaType}
 */
const _getSchema = (fastify, namespace) =>
  (slug) => fastify.getSchema(_makeSchemaUri(namespace)(slug));

/**
 * decorate fastify with namespaced schemas
 * @param {FastifyInstanceType} fastify
 * @param {{ namespace: string, addSchemasFunc: Function }} options
 */
const addSchemasDecorator = (fastify, options) => {
  if ( !(options.namespace || "").length ) {
    throw new Error(`addSchemasDecorator requires options.namespace to be set ! Got '${options.namespace}'`);
  }
  if ( !options.addSchemasFunc || typeof options.addSchemasFunc !== "function" ) {
    throw new Error(`addSchemasDecorator requires options.addSchemasFunc to be a function ! Got '${options.addSchemasFunc}'`)
  }

  const
    { namespace, addSchemasFunc } = options,
    makeSchemaUri = _makeSchemaUri(namespace),
    getSchema = _getSchema(fastify, namespace);

  fastify = addSchemasFunc(fastify, makeSchemaUri);
  fastify.decorate(namespace, {
    makeSchemaUri: makeSchemaUri,
    getSchema: getSchema
  })
}

function schemas(fastify, options, done) {

  const schemasData = [
    ["schemasPresentation2", addSchemasPresentation2],
    ["schemasPresentation3", addSchemasPresentation3],
    ["schemasBase", addSchemasBase],
    ["schemasRoutes", addSchemasRoutes],
  ]

  fastify.register(schemasResolver);

  for ( let [schemasNamespace, addSchemasFunc] of schemasData ) {
    addSchemasDecorator(fastify, {
      namespace: schemasNamespace,
      addSchemasFunc: addSchemasFunc,
    })
  }

  done()
}

export default fastifyPlugin(schemas);