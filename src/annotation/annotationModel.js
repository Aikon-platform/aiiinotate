/** @typedef {import("mongodb").Db} Db */


// datetime timestamp should follow RFC3339 section 5.6. see: https://datatracker.ietf.org/doc/html/rfc3339#section-5.6
// we don't add regex validation for performance reasons.
// NOTE: full-date format is defined with an offset (that we don't have): YYYY-MM-DDTHH:MM:SS + Z + time-offset. is that a problem ?
const dateTimeSchema = {
  bsonType: "string",
  description: "timesamp. should be in 'YYYY-MM-DD(THH:MM:SS?Z?)', eg: '2025-03-19T14:38:38'"
}

const annotationSchema = {
  $jsonSchema: {
    title: 'Annotation object validation',
    required: ['id', 'target'], // NOTE better determine what is required baed on W3C annotations
    properties: {
      id: {
        // a.id
        bsonType: 'string',
        description: 'string ID of the resource'
      },
      target: {
        // tbd
        //  - simple URL or ImageApiSelector ? https://github.com/Aikon-platform/aiiinotate/blob/main/docs/specifications/1_iiif_apis.md#imageapiselector
        //  - what about polygon selectors ?
      },
      motivation: {
        // IIIF 3.0: a.motivation
        // NOTE : 3.0 allows only "painting", "supplementing", 2.0 allows "sc:painting", "oa:commenting" and maybe others
        //    => we will need to do data conversion for those values as well
        bsonType: ['string'],
        description: 'defines how the annotation is handled see: https://iiif.io/api/presentation/3.0/#35-values'
      },
      // IIIF 2.0: dcterms:created
      created: dateTimeSchema,
      // IIIF 2.0: dcterms:modified
      modified: dateTimeSchema,
      bodyId: {
        // IIIF 3.0: a.body.id
        bsonType: 'string',
        description: 'if the annotation is referenced, URL of the content. otherwise, URL ID for the annotation'
      },
      bodyType: {
        // IIIF 3.0: a.body.type
        //  NOTE : 2.0 allows cd:terms, 3.0 allows only the values defined below => do data conversion
        bsonType: 'string',
        enum: ['Dataset', 'Image', 'Video', 'Sound', 'Text'], // w3c allowed types
        description: 'type of the annotation'
      },
      bodyValue: {
        // IIIF 3.0: a.body.value
        bsonType: 'string',
        description: 'textual content ofthe annotation, if it is embedded'
      },
      bodyFormat: {
        // IIIF 3.0: a.body.format
        bsonType: 'string',
        description: 'mimetype of the annotation'
      }
    }
  }
}

/**
 * @param {Db} db
 * @param {object} annotation: annotation, structure following the `annotationSchema`
 */
function annotationInsert(db, annotation) {
  const annotations = db.annotations;

  const result = annotations.insert(annotation);
}

/**
 * @param {Db} db
 * @param {object[]} annotationArray: list of annotations, following the `annotationSchema`
 */
function annotationInsertMany(db, annotationArray) {

}

// TBD
function annotationRead(db, filter) { }

export {
  annotationSchema
}
