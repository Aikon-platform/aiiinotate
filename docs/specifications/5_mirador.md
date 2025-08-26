# WRITING A MIRADOR PLUGIN

To integrate an annotation server with Mirador, we need to write a Mirador plugin that that interfaces Mirador with the annotation server.

Writing a mirador plugin is actually really simple: see the [annotot endpoint plugin](https://github.com/ProjectMirador/mirador-annotot-endpoint-plugin)

SAS apparently uses a [custom version of Mirador 2](https://github.com/glenrobson/SimpleAnnotationServer/tree/master/src/main/webapp/mirador-2.6.1)

---

## Sources

- [Mirador docs: plugins](https://github.com/ProjectMirador/mirador/wiki/Mirador-3-plugins)
- [Mirador docs: writing a plugin](https://github.com/ProjectMirador/mirador/wiki/Creating-a-Mirador-4-plugin)
- [Mirador annoto endpoint](https://github.com/ProjectMirador/mirador-annotot-endpoint-plugin/tree/master)

---

## Install and use a Mirador plugin

1. npm-install the plugin you want to use:
    ```bash
    npm install mirador-image-tools --save
    ```
2. when instanciating Mirador, add the plugin to the `plugins` array:
    ```js
    import miradorImageToolsPlugin from 'mirador-image-tools/es/plugins/miradorImageToolsPlugin.js';

    const config = {
        // your Mirador config
    };

    const plugins = [
        ...miradorImageToolsPlugin
    ];

    Mirador.viewer(config, plugins);
    ```

---

## Writing a plugin

### General architecture

```
root/
 |_src
    |_index.js               // exports the plugin
    |_components/            // folder containing all the react components that comprise the plugin
       |_pluginComponent.js  // the react files.
```

### Plugin config

The plugin's configuration in `index.js` defines how to inject the plugin in Mirador:
```js
const plugin = {
    target: 'WorkspaceControlPanelButtons',                 // where to inject the plugin in the Mirador architecture
    mode: 'wrap',                                           // how to inject. "add"/"wrap"
    component: PluginComponent,                             // the plugin as a React component
    // `connectOptions`, `mapStateToProps` and `mapDispatchToProps` connect the plugin to Mirador
    connectOptions: additionalOptionsToPassToReduxConnect,  // plugin extras
    mapStateToProps: mapStateToProps,                       // React redux function that connects store data with react props
    mapDispatchToProps: mapDispatchToProps,                 // React redux function that dispatches actions to the store
    // `reducers` and `saga` manipulate state
    reducers: {
        pluginState: pluginStateReducer,
    },
    saga: saga 
};
```

`PluginComponent` is a React component that contains the entire plugin. Nested React components are allowed in `PluginComponent`.

About the `mode`:
- `mode=add` injects the component at designated areas of the Mirador app.
- `mode=wrap` overrides mirador behaviour. 
    - wrapping plugins can:
        - replace the content of a Mirador coponent
        - wrap a Mirador component with additional context
        - to intercept and modify the attributes of a component
    - all Mirador components can be wrapped

### Plugin components

A plugin component is a React component:

```js
import React, { Component } from 'react';

export default function () {
  return <h5>Custom metadata!</h5>;
}
```

In the example above,
- if `mode=add`, the `PluginComponent` will will be added as a child of its `target`.
- if `mode=wrap`, the `PluginComponent` will replace the `target`.

When `mode = wrap`, the plugin component can modify its `target`. The plugin will receive the Mirador component that is being wrapped as an attribute => we can change the props of the component, surround it with extra context, change its behaviour...

```js
import React, { Component } from 'react';

export default function ({ TargetComponent, targetProps  }) {
  return <TargetComponent {...targetProps} />;
}
``` 

--- 

## Annotot plugin 

- [repo](https://github.com/ProjectMirador/mirador-annotot-endpoint-plugin/)
- [plugin component](https://github.com/ProjectMirador/mirador-annotot-endpoint-plugin/blob/master/src/plugins/miradorAnnototEndpointPlugin.js)
- [plugin config](https://github.com/ProjectMirador/mirador-annotot-endpoint-plugin/blob/42a04b93429b0a85dee50a3dbe4d6d5e3fb8046e/src/plugins/miradorAnnototEndpointPlugin.js#L65)
- [usage demo](https://github.com/ProjectMirador/mirador-annotot-endpoint-plugin/blob/master/demo/src/index.js)

