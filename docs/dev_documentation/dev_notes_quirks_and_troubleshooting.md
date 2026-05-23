# Notes, quirks and troubleshooting

---

## Notes

### Uniqueness

As of writing (09.10.25), there are no uniqueness constraints on annotations. There is only a uniqueness constraint on collection `manifest2` on field `manifest2.@id` (the ID of a manifest).

Ideally, we would want to avoid having duplicate annotations in the database. This is more complicated in practice: at least for `annotions2`, an annotation's `@id` field is re-generated and a random part (an UUID) is generated at insert time. This means that, when trying to store the same annotation (with the same `@id`), the `@id` is changed, and so a different value is inserted.

This means that we can't have a uniqueness constraint on `@id` or `id` fields of annotations. Another option would be to have a uniqueness constraint on annotation targets (no 2 annotations can annotate the same region), but this behaviour seems brittle in practice, so it's not yet implemented.

### Concurrency

For clients, concurrency/parrallelization (i.e., with JS `Promise.all()`) on insert/update should be avoided because it can cause a data race: several processes can attempt to write the same thing in parrallel.

For example, when inserting annotations, the manifests related to each annotation are inserted in parrallel. Since this is a side effect, 2 processes may unknowingly try to insert the same manifest in the database, which causes a uniqueness constraint to fail. This error can be hard to debug, so it's best to avoid concurrency at write time.

---

## Dev quirks

Sometimes, node/fastify can be weird. When scratching your head at dev errors, look here:)

### Error swallowing at app build

Errors that happen when a plugin is being registered will cause the app's startup to fail, without necessarily throwing an error.

This is especially true for test cases that build the fastify app:

```
test
=> build fastify app
=> build step fails silently
=> test fails
```

#### Troubleshooting

- normal behaviour: when a runtime error happens, the failing test will log the error on the console
- what this error looks like:
    - tests fail **very quickly**,
    - without throwing an error, seemingly without even running the test suite
    - the proces doesn't exit, although all tests have failed
- when `npm run test` fails like this, run `npm run start`. See if normal startup throws an error
    - NOTE: normal startup not throwing does NOT mean that the build step necessarily worked

#### Possible help/solutions

- find a way to stisfyingly use `try...catch` at plugin registration.
- look into these issues: [2694](https://github.com/fastify/fastify/issues/2694)
    - in particular, it may be an issue specific to async plugins ?

### Route response schema definition

For some reason, route schema definition is much less flexible for responses than for queries.

#### The problem

**Query schemas**: In queries (`schema.params` or `schema.querystring`), fastify is very permissive. You can use unresolved schemas (with `$ref`), save entire schemas as JsonSchemas ...

**Response schemas**: Response schemas have more constraints.
- **response schemas are defined at route level** and cannot be stored as full JsonSchemas:
    ```js
    // this will be an invalid response schema: it is trying to store a complete response schema as a JsonSchema
    fastify.addSchema({
        $id: makeSchemaUri("routeResponsePost"),
        properties: {
            200: { ... },
            500: { ... },
        }
    })

    // this is a fixed version: an object containing schemas, not a full JsonSchema, to be used inside a Route definition
    schema: {
        response: {
            200: { ... },
            500: { ... }
        }
    }
    // if you want to reuse a schema, store it as a JS object and import it.
    ```
- **unresolved response schemas (`$ref`) are forbidden**. You cannot use `$ref`. In the app, use `fastify.schemasResolver` to resolve the schema to a plain `JsonSchema` without `$ref`.

#### The fix

In short, here's **how to use shared schemas in responses**:
1. Define payload schemas for different response cases:
    ```js
    // in case of a POST success
    fastify.addSchema({
        $id: makeSchemaUri("routeResponseInsert"),
        type: "object",
        // ...properties
    });

    // in case of a POST error
    fastify.addSchema({
        $id: makeSchemaUri("routeResponseError"),
        type: "object",
        // ...properties
    });
    ```
2. Resolve schemas and use in responses
    ```js
    const routeResponseInsert = fastify.getSchema("...");
    const routeResponseError = fastify.getSchema("...");
    fastify.post(
        "/annotations/:iiifPresentationVersion/create",
        {
            schema: {
                body: routeAnnotations2Or3Schema,
                response: {
                    200: routeResponseInsert,
                    500: routeResponseError
               }
            }
        },
        async (req, rep) => {}
    )
    ```

### `migrate revert-all && migrate apply`

#### The problem

Sometimes, you want to remove all migrations and then rerun them. This will cause an error like:

```bash
{
    ...,
    errmsg: 'namespace aiiinotate.manifests2 already exists, but with different options: { uuid: UUID("65ca87c4-ddce-4c2d-a6f9-08ff6b70c0a7"), validationLevel: "strict", validationAction: "error" }',
    code: 48,
    codeName: 'NamespaceExists',
    ...
}
```

#### The fix

I figure it's an error due to cache or something like that. Either wait or manually delete the collection or the entire database using `mongosh`.