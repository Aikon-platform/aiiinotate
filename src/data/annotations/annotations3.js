import fastifyPlugin from "fastify-plugin";

import AnnotationsAbstract from "#annotations/annotationsAbstract.js";


/**
 * @extends {AnnotationsAbstract}
 */
class Annnotations3 extends AnnotationsAbstract {
  /**
   * @param {import("fastify").FastifyInstance} fastify
   */
  constructor(fastify) {
    super(fastify, 3);
  }

  notImplementedError() {
    throw new Error(`${this.constructor.name}: not implemented`);
  }

}

export default fastifyPlugin((fastify, options, done) => {
  fastify.decorate("annnotations3", new Annnotations3(fastify));
  done();
}, {
  name: "annotations3",
  dependencies: ["manifests3"]
})

// /**
//  * JSON schema for IIIF 3.x
//  *
//  * NOTE: possibly deprecated
//  */
// const annotations3Schema = {
//   title: 'Annotation object validation',
//   required: ['id', 'target'], // NOTE better determine what is required baed on W3C annotations
//   properties: {
//     // NOTE:
//     // this is a validator following the IIIF 3.0 specification.
//     // an internal data format could have the keys:
//     // `{id, target, motivation, bodyId, bodyType, bodyValue, bodyFormat}`
//     // and then serialize everything.
//     id: {
//       // IIIF 3.0: a.id
//       //  - the ID is auto-defined by aiiinotate and is the ID of the whole annotation
//       //  - do we store the full URL or just the relevant section for quicker lookup ?
//       //
//       bsonType: 'string',
//       description: 'string ID of the resource'
//     },
//     target: {
//       // IIIF 3.0: a.target
//       // TBD: how do we target that ?
//       //  - simple URL or ImageApiSelector ? https://github.com/Aikon-platform/aiiinotate/blob/main/docs/specifications/1_iiif_apis.md#imageapiselector
//       //  - what about polygon selectors ?
//     },
//     motivation: {
//       // IIIF 3.0: a.motivation
//       bsonType: ['string'],
//       enum: ['painting', 'supplementing'], // TBD regex validation cost ??
//       description: 'defines how the annotation is handled see: https://iiif.io/api/presentation/3.0/#35-values'
//     },
//     type: {
//       // IIIF 3.0: a.type
//       bsonType: 'string',
//       enum: ['Annotation'],
//       description: 'defines this resource as an annotation'
//     },
//     body: {
//       // IIIF 3.0: a.body
//       bsonType: 'object',
//       properties: {
//         id: {
//           // IIIF 3.0: a.body.id
//           bsonType: 'string',
//           description: 'if the annotation is referenced, URL of the content. otherwise, URL ID for the annotation'
//         },
//         type: {
//           // IIIF 3.0: a.body.type
//           bsonType: 'string',
//           type: ['Dataset', 'Image', 'Video', 'Sound', 'Text'], // w3c allowed types
//           description: 'type of the annotation'
//         },
//         value: {
//           // IIIF 3.0: a.body.value
//           bsonType: 'string',
//           description: 'content ofthe annotation, if it is embedded'
//         },
//         format: {
//           // IIIF 3.0: a.body.format
//           bsonType: 'string',
//           description: 'mimetype of the annotation'
//         }
//       }
//     }
//   }
// }
