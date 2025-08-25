// import { objectHasKey, addKeyValueToObjIfHasKey, isNullish, getHash } from "#annotations/utils.js"}
//
// // datetime timestamp should follow RFC3339 section 5.6. see: https://datatracker.ietf.org/doc/html/rfc3339#section-5.6
// // we don't add regex validation for performance reasons.
// // NOTE: full-date format is defined with an offset (that we don't have): YYYY-MM-DDTHH:MM:SS + Z + time-offset. is that a problem ?
// const dateTimeSchema = {
//   bsonType: "string",
//   description: "timesamp. should be in 'YYYY-MM-DD(THH:MM:SS?Z?)', eg: '2025-03-19T14:38:38'"
// }
//
// /** @deprecated UNUSED old schema internal to store annotations. */
// const annotationsSchema = {
//   $jsonSchema: {
//     title: 'Annotation object validation',
//     required: ['id', 'target', 'motivation'], // NOTE better determine what is required baed on W3C annotations
//     properties: {
//       id: {
//         // a.id
//         bsonType: 'string',
//         description: 'string ID of the resource'
//       },
//       target: {
//         // tbd
//         //  - simple URL or ImageApiSelector ? https://github.com/Aikon-platform/aiiinotate/blob/main/docs/specifications/1_iiif_apis.md#imageapiselector
//         //  - what about polygon selectors ?
//       },
//       motivation: {
//         // IIIF 3.0: a.motivation
//         // NOTE : 3.0 allows only "painting", "supplementing", 2.0 allows "sc:painting", "oa:commenting" and maybe others
//         //    => we will need to do data conversion for those values as well
//         bsonType: 'array',
//         items: {
//           type: "string"
//         },
//         description: 'defines how the annotation is handled see: https://iiif.io/api/presentation/3.0/#35-values'
//       },
//       // IIIF 2.0: dcterms:created
//       created: dateTimeSchema,
//       // IIIF 2.0: dcterms:modified
//       modified: dateTimeSchema,
//       bodyId: {
//         // IIIF 3.0: a.body.id
//         bsonType: 'string',
//         description: 'if the annotation is referenced, URL of the content. otherwise, URL ID for the annotation'
//       },
//       bodyType: {
//         // IIIF 3.0: a.body.type
//         //  NOTE : 2.0 allows cd:terms, 3.0 allows only the values defined below => do data conversion
//         bsonType: 'string',
//         enum: ['Dataset', 'Image', 'Video', 'Sound', 'Text'], // w3c allowed types
//         description: 'type of the annotation'
//       },
//       bodyValue: {
//         // IIIF 3.0: a.body.value
//         bsonType: 'string',
//         description: 'textual content ofthe annotation, if it is embedded'
//       },
//       bodyFormat: {
//         // IIIF 3.0: a.body.format
//         bsonType: 'string',
//         description: 'mimetype of the annotation'
//       }
//     }
//   }
// }
//
// /**
//  * @deprecated
//  * @param {Db} db
//  * @param {object} annotation: annotation to insert
//  */
// async function annotationsInsert(db, annotation) {
//   const annotations = db.annotations;
//   const result = await annotations.insertOne(annotation);
//   return result.insertedId;
// }
//
// /**
//  * @deprecated
//  * @param {Db} db
//  * @param {object[]} annotationArray: list of annotations to insert
//  * @returns {number} number of inserted ids
//  */
// async function annotationsInsertMany(db, annotationArray) {
//   console.log(annotationArray);
//   const annotations = db.collection("annotations");
//   try {
//     const result = await annotations.insertMany(annotationArray);
//     return result.insertedCount;
//   } catch (e) {
//     console.log("error inserting", e)
//   }
// }
//
// /**
//  * @example
//  * x = {
//  *  "@id" : "http://aikon.enpc.fr/sas/annotation/wit9_man11_anno165_c10_d47559c226ae4acaae2e50f5bbc6f4e8",
//  *  "@type" : "oa:Annotation",
//  *  "dcterms:created" : "2025-03-19T14:38:38",
//  *  "dcterms:modified" : "2025-03-19T14:38:38",
//  *  "resource" : {
//  *    "@type" : "dctypes:Text",
//  *    "format" : "text/html",
//  *    "chars" : "<p></p>",
//  *    "https://aikon.enpc.fr/sas/full_text" : "",
//  *    "https://iscd.huma-num.fr/sas/full_text" : ""
//  *  }
//  *  "on" : "https://aikon.enpc.fr/aikon/iiif/v2/wit9_man11_anno165/canvas/c10.json#xywh=5,0,1824,2161",
//  *  "motivation" : [ "oa:tagging", "oa:commenting" ],
//  *  "@context" : "http://iiif.io/api/presentation/2/context.json",
//  *  "label" : ""
//  * };
//  * annotationToInternal(x)
//  * // returns
//  * {
//  *  "id": "http://aikon.enpc.fr/sas/annotation/wit9_man11_anno165_c10_d47559c226ae4acaae2e50f5bbc6f4e8",
//  *  "target": "https://aikon.enpc.fr/aikon/iiif/v2/wit9_man11_anno165/canvas/c10.json#xywh=5,0,1824,2161",
//  *  "motivation": [ "oa:tagging", "oa:supplementing" ],  !!! WARNING will need to be back-converted at output
//  *  "created" : "2025-03-19T14:38:38",
//  *  "modified" : "2025-03-19T14:38:38",
//  *  "bodyId": "",
//  *  "bodyType": "Text",
//  *  "bodyFormat": "text/html",
//  *  "bodyValue": ""
//  * }
//  * @param {object} annotation
//  * @returns {object}
//  */
// function fromIiif2Annotation(annotation) {
//   // how AnnotationLists are imported into SAS : https://github.com/glenrobson/SimpleAnnotationServer/blob/dc7c8c6de9f4693c678643db2a996a49eebfcbb0/src/main/java/uk/org/llgc/annotation/store/AnnotationUtils.java#L67
//   let out = {
//     "id": makeAnnotationId(annotation),
//     "target": makeTarget(annotation),  // NOTE: won't work if `annotation.on` is not a string !
//     "motivation": [],
//   };
//   out = addKeyValueToObjIfHasKey(annotation, out, "dcterms:created", "created");
//   out = addKeyValueToObjIfHasKey(annotation, out, "dcterms:modified", "modified");
//   if ( objectHasKey(annotation, "motivation") ) {
//     out.motivation = Array.isArray(annotation.motivation)
//       ? annotation.motivation
//       : [annotation.motivation]
//   }
//   if ( objectHasKey(annotation, "resource") ) {
//     const resource = annotation.resource;  // source
//     out = addKeyValueToObjIfHasKey(resource, out, "@id", "bodyId");
//     out = addKeyValueToObjIfHasKey(resource, out, "format", "bodyFormat");
//     if ( objectHasKey(resource, "@type") ) {
//       const bodyType = dcTypesToWebAnnotationTypes(resource["@type"]);
//       out.bodyType = bodyType;
//     }
//     if (
//       objectHasKey(resource, "chars")
//       && !(isNullish(resource.chars))
//       && resource.chars != "<p></p>"
//     ) {
//       out.bodyValue = resource.chars
//     }
//   }
//   return out;
// }
//
// /**
//  * @param {object} annotationList
//  * @returns {object[]}
//  */
// function fromIiif2AnnotationList(annotationList) {
//   return annotationList.resources.map(fromIiif2Annotation)
// }
//