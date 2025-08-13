const annotationSchema = {
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
      bsonType: ['string'],
      enum: ['painting', 'supplementing'], // TBD regex validation cost ??
      description: 'defines how the annotation is handled see: https://iiif.io/api/presentation/3.0/#35-values'
    },
    bodyId: {
      // IIIF 3.0: a.body.id
      bsonType: 'string',
      description: 'if the annotation is referenced, URL of the content. otherwise, URL ID for the annotation'
    },
    bodyType: {
      // IIIF 3.0: a.body.type
      bsonType: 'string',
      type: ['Dataset', 'Image', 'Video', 'Sound', 'Text'], // w3c allowed types
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

export {
  annotationSchema
}
