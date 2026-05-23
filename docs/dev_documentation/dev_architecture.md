# Architecture

This is a high-level overview of the Aiiinotate and a good place to start if you want to work on the app

---

## Top level plugins

Fastify uses a [**plugin system**](https://fastify.dev/docs/latest/Guides/Plugins-Guide/). In short, it means that,
- to access the global `fastify` instance, your code needs to be a plugin
- all plugins must export a single function that registers the plugin on the global fastify instance

This can be quite convoluted and conflict with a "normal" module architecture, so we do a mix of the two:
- **all modules at the root** of `src/` are plugins (except `config`)
- **nested plugins** within each of the above are defined when they need to access the fastify instance.

```
./src/fixtures/ - module storing and serving data files for test fixtures
./src/schemas/    - JsonSchemas definition and validation
./src/db/         - connects the app to the mongojs database
./src/data/       - routes and modules to read/write data

```

---

## The `data` plugin

### In general

As you can see, the `data` plugin stores the vast majority of the app's logic. It defines:
- **`route.js` files** HTTP routes for user interactions
- **`collection classes`** (`abstractCollection.js`, `manifests(2|3).js`, `annotations(2|3).js`) for each MongoJS collection that handles all internal functionnalities for all collections (read/write/update/delete data)

Each `route` and `class` is a fastify plugin. Since the `data` plugin is registered last, it can access functionalities from all other root plugins defined above.

### Structure and inheritence

```
├── index.js               // `data` plugin root
├── routes.js              // generic routes
├── annotations
│   ├── annotations2.js    // plugin for IIIF presentation 2 annotations
│   ├── annotations3.js    // plugin for IIIF presentation 3 annotations
│   ├── routes.js          // routes for both plugins
├── collectionAbstract.js  // abstract class with functionnalities for all plugins
├── manifests
    ├── manifests2.js      // plugin for IIIF presentation 2 manifests
    ├── manifests3.js      // plugin for IIIF presentation 3 manifests
    ├── routes.js          // routes for both plugins
```

At a high level, `route` files receive data and relegate internal mongoJS interaction to the `collection classes`. Once these processes are finished, the `collection classes` return data to the `routes`, which send the response to the users. So:

- the work of `routes` is to define input/output JsonSchemas and delegate to the proper `collection classes`
- the work of `classes` is to do the database interaction, data formatting etc.

Our 5 `collection classes` (`collectionAbstract`, `annotations2`, `annotations3`, `manifests2`, `manifests3`) use class inheritence: all classes inherit from `collectionAbstract`
- `collectionAbstract` defines collection-agnostic processes that can be used by all other classes.
- other classes implement functionnalities for a specific data type and collection.

---

## Details: why plugins are complicated ?

If using a plugin-only architecture, **you should not do "local" imports** (imports from one part of your app to another): everything that you want to communicate between apps must be registered as a plugin on the global fastify instance, and then other files need to access the fastify instance:

```js
// here, we define a root plugin with 2 subplugins (1st is a decorator, 2nd a normal plugin).
fastify.register((instance, opts, done) => {

  // decorator
  instance.decorate('util', (a, b) => a + b)
  console.log(instance.util('that is ', 'awesome'))

  // plugin
  fastify.register((instance, opts, done) => {
    console.log(instance.util('that is ', 'awesome'))
    done()
  })

  done()
})
```

In the above example, functionnalities defined in each plugin (except decorators) are encapsulated: a plugin is a scope and everything that's defined in a plugin must be accessed through the fastify instance. There is also the question of plugins vs. decorators, plugin definition order...

In short, if using a plugin-only architecture, every single one of your files would have to be a plugin, registered in the proper order... It would be hell.
