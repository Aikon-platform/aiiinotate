import fastifyPlugin from "fastify-plugin";

/**
 * resolve schemas: convert all references to external schemas to embedded JsonSchemas.
 *
 * mongo doesn't implement the whole JSONSchema standard, and in some places in fastify (i.e., routes response schemas), references (`$ref`) are not allowed.
 * in the app and in this module, our schemas are defined according to the full Fastify implementation, to use the schemas everywhere, we need to convert them.
 *
 * conversion primarily means converting all `$ref` references to external schemas to the JsonSchemas referenced.
 *
 * JSONSchema has a recursive data model in which a root schema contains  nested schemas in a tree structure. in turn, our conversion function is recursive.
 *
 * NOTE: our conversion function DOES NOT DO ALL CONVERSIONS, only what we need.
 * for example, we suppose that our schemas are built using $ref's to external schemas, and not defining sub-schemas in the `definitions` field.
 *
 * see: https://www.mongodb.com/docs/manual/reference/operator/query/jsonSchema/#omissions
 */
function schemasResolver (fastify, schema) {
  const funcName = schemasResolver.name;

  // no need to process strings, booleans or numbers
  if ( typeof schema==="string" || typeof schema==="number" || typeof schema==="boolean" ) {
    return schema
  }
  // convert each item in arrays
  else if ( Array.isArray(schema) ) {
    return schema.map((item) => schemasResolver(fastify, item));
  }
  // convert each key-value pair. this is actually the main part that will delta to the above branches.
  else if ( schema.constructor === Object ) {
    const out = {};

    for ( let [k,v] of Object.entries(schema) ) {
      // $id is not allowed => remove it
      if ( k==="$id" ) {
        continue
      }
      // $refs must be resolved => replace the kv pair { $ref: schemaUri } with the corresponding schemas and process convert those schemas to mongo.
      else if ( k==="$ref" ) {
        return schemasResolver(fastify, fastify.getSchema(v))
      }
      // convert JsonSchema integer types to bsonType: int
      else if ( k==="type" && v==="integer" )
        out.bsonType = "int";
      // failsafe for other JsonSchema fields that are unimplemented by Mongo.
      // NOTE: "format" is also a JsonSchema keyword, but the "format" keyword
      // is used in our annotations, so we don't raise if it is encounetered.
      // this filter could be fine-tuned to work only at top-level of schemas. for now, we allow "format¨.
      else if ( ["$schema", "$default", "definitions"].includes(k) ) {
        throw new Error(`${funcName}: JSONSchema field '${k}' conversion to Mongo schema is not implemented ! in schema: ${schema}`);
      }
      // it's a "normal" value => process it.
      else {
        out[k] = schemasResolver(fastify, v);
      }
    }

    return out;
  }
  else {
    throw new Error(`${funcName}: cannot process unexpected type: '${typeof k}' in schema ${schema}`);
  }
}

function schemasResolverPlugin(fastify, options, done) {
  fastify.decorate("schemasResolver", (schema) => schemasResolver(fastify, schema));
  done();
}

export default fastifyPlugin(schemasResolverPlugin);

