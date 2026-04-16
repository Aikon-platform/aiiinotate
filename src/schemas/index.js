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