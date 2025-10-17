/**
 * IIIF presentation 2.1 annotation internals: convert incoming data, interct with the database, return data.
 * exposes an `Annotations2` class that should contain everything you need to interact with the annotations2 collection.
 */
import fastifyPlugin from "fastify-plugin";

import CollectionAbstract from "#data/collectionAbstract.js";
import { IIIF_PRESENTATION_2_CONTEXT } from "#utils/iiifUtils.js";
import { ajvCompile, objectHasKey, isNullish, maybeToArray, inspectObj, visibleLog } from "#utils/utils.js";
import { getManifestShortId, makeTarget, makeAnnotationId, toAnnotationList, canvasUriToManifestUri } from "#utils/iiif2Utils.js";


/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */
/** @typedef {import("#types").MongoObjectId} MongoObjectId */
/** @typedef {import("#types").MongoInsertResultType} MongoInsertResultType */
/** @typedef {import("#types").MongoUpdateResultType} MongoUpdateResultType */
/** @typedef {import("#types").MongoDeleteResultType} MongoDeleteResultType */
/** @typedef {import("#types").InsertResponseType} InsertResponseType */
/** @typedef {import("#types").UpdateResponseType} UpdateResponseType */
/** @typedef {import("#types").DeleteResponseType} DeleteResponseType */
/** @typedef {import("#types").DataOperationsType } DataOperationsType */
/** @typedef {import("#types").AnnotationsDeleteKeyType } AnnotationsDeleteKeyType */
/** @typedef {import("#types").Manifests2InstanceType} Manifests2InstanceType */
/** @typedef {import("#types").AjvValidateFunctionType} AjvValidateFunctionType */

/** @typedef {Annotations2} Annotations2InstanceType */

// RECOMMENDED URI PATTERNS https://iiif.io/api/presentation/2.1/#a-summary-of-recommended-uri-patterns
//
// Collection 	             {scheme}://{host}/{prefix}/collection/{name}
// Manifest 	               {scheme}://{host}/{prefix}/{identifier}/manifest
// Sequence 	               {scheme}://{host}/{prefix}/{identifier}/sequence/{name}
// Canvas 	                 {scheme}://{host}/{prefix}/{identifier}/canvas/{name}
// Annotation (incl images)  {scheme}://{host}/{prefix}/{identifier}/annotation/{name}
// AnnotationList            {scheme}://{host}/{prefix}/{identifier}/list/{name}
// Range 	                   {scheme}://{host}/{prefix}/{identifier}/range/{name}
// Layer 	                   {scheme}://{host}/{prefix}/{identifier}/layer/{name}
// Content 	                 {scheme}://{host}/{prefix}/{identifier}/res/{name}.{format}

/**
 * @extends {CollectionAbstract}
 */
class Annotations2 extends CollectionAbstract {

  /**
   * @param {FastifyInstanceType} fastify
   */
  constructor(fastify) {
    super(fastify, "annotations2");
    /** @type {Manifests2InstanceType} */
    this.manifestsPlugin = this.fastify.manifests2;
    /** @type {AjvValidateFunctionType} */
    this.validatorAnnotationList = ajvCompile(fastify.schemasResolver(
      fastify.schemasPresentation2.getSchema("annotationList")
    ));
  }

  ////////////////////////////////////////////////////////////////
  // utils

  /**
   * clean the body of an annotation (annotation.resource).
   * if `annotation.resource` is an array (there are several bodies associated to that annotation), this function must be called on each item of the array
   * @param {object} resource
   * @returns {object | null} - the resource, or `null` if the resource is either an empty Embedded Textual Body or has no `@id`
   */
  #cleanAnnotationResource(resource) {
    if ( resource ) {
      // 1) uniformize embedded textual body keys
      // OA allows `cnt:ContentAsText` or `dctypes:Text` for Embedded Textual Bodies, IIIF only uses `dctypes:Text`
      resource["@type"] =
        resource["@type"] === "cnt:ContentAsText"
          ? "dctypes:Text"
          : resource["@type"];

      // OA stores Textual Body content in `cnt:chars`, IIIF uses `chars`. `value` is sometimes also used
      resource.chars = resource.value || resource["cnt:chars"] || resource.chars;  // may be undefined
      // delete the alternate keys
      [ "value", "cnt:chars" ].map((k) => {
        if ( Object.keys(resource).includes(k) ) {
          delete resource[k];
        }
      })

      // 2) return `null` if resource is empty. a body is empty if
      //  - it's got no `@id` (=> it's not a referenced textaul body)
      //  - it's not an Embedded Textual Body, or it's an empty Embedded Textual Body.
      // see: https://github.com/Aikon-platform/aiiinotate/blob/dev/docs/specifications/0_w3c_open_annotations.md#embedded-textual-body-etb
      const
        hasTextualBody = objectHasKey(resource, "chars"),
        emptyBody = isNullish(resource.chars) || resource.chars === "<p></p>";
      if ( isNullish(resource["@id"]) && (emptyBody || !hasTextualBody) ) {
        return null
      }
    }
    return resource;
  }

  /**
   * clean an annotation before saving it to database.
   * some of the work consists of translating what is defined by the OpenAnnotations standard to what is actually used by IIIF annotations.
   * if `update`, some cleaning will be skipped (especially the redefinition of "@id"), otherwise updates would fail.
   *
   * @param {object} annotation
   * @param {boolean} update - set to `true` if performing an update instead of an insert.
   * @returns {object}
   */
  #cleanAnnotation(annotation, update=false) {
    // 1) extract ids and targets
    const
      annotationTarget = makeTarget(annotation),
      manifestShortId = getManifestShortId(annotationTarget.full);

    // in updates, "@id" has aldready been extracted
    if ( !update ) {
      annotation["@id"] = makeAnnotationId(annotation, manifestShortId);
    }
    annotation["@context"] = IIIF_PRESENTATION_2_CONTEXT["@context"];
    annotation.on = annotationTarget;
    annotation.on.manifestShortId = manifestShortId;

    // 2) process motivations.
    // - motivations are an array of strings
    // - open annotation specifies that motivations should be described by the `oa:Motivation`, while IIIF 2.1 examples uses the `motivation` field => uniformizwe
    // - all values must be `sc:painting` or prefixed by `oa:`: IIIF presentation API indicates that the only allowed values are open annotation values (prefixed by `oa:`) or `sc:painting`.
    if ( objectHasKey(annotation, "oa:Motivation") ) {
      annotation.motivation = annotation["oa:Motivation"];
      delete annotation["oa:motivation"];
    }
    annotation.motivation =
      maybeToArray(annotation.motivation || [])
        .map(String)
        .map((motiv) =>
          motiv.startsWith("oa:") || motiv.startsWith("sc:")
            ? motiv
            : `oa:${motiv}`
        );

    // 3) process the resource. Resource can be either undefined, an array of objects or a single object. process all objects and, if there's no resource content, delete `annotation.resource`.
    let resource = annotation.resource || undefined;
    if ( resource ) {
      resource =
        Array.isArray(resource)
          ? resource.map((r) => this.#cleanAnnotationResource(r)).filter((r) => r !== null)
          : this.#cleanAnnotationResource(resource);
    }
    if ( resource === null || resource === undefined || (Array.isArray(resource) && !resource.length) ) {
      delete annotation.resource;
    } else {
      annotation.resource = resource;
    }
    return annotation;
  }

  /**
   * take an annotationList, clean it and return it as a array of annotations.
   * see: https://iiif.io/api/presentation/2.1/#annotation-list
   * @param {object} annotationList
   * @returns {object[]}
   */
  #cleanAnnotationList(annotationList) {
    // NOTE: if `this.#cleanAnnotationList` can only be accessed from annotations routes, then this check is useless (has aldready been performed).
    if ( this.validatorAnnotationList(annotationList) ) {
      this.errorNoAction("Annotations2.#cleanAnnotationList: could not recognize AnnotationList. see: https://iiif.io/api/presentation/2.1/#annotation-list.", annotationList)
    }
    //NOTE: using an arrow function is necessary to avoid losing the scope of `this`. otherwise, `this` is undefined in `#cleanAnnotation`.
    return annotationList.resources.map((ressource) => this.#cleanAnnotation(ressource))
  }

  /**
   * handle all side effects on the `manifests2` collection. this does 2 things:
   * - insert all manifests referenced by `annotationData`, and set a key `on.manifestId` on all annotations.
   * - set a key `on.canvasIdx`, containing the position of the annotation's target canvas in the manifest,
   *    (or undefined if the manifest or canvas were not found).
   * @param {object|object[]} annotationData - an annotation, or array of annotations.
   */
  async #insertManifestsAndGetCanvasIdx(annotationData) {
    // TODO  : extract all canvas Ids, reconstruct manifest IDs from it. if they're valid, insert the manifests into the db.
    // convert objects to array to get a uniform interface.
    let converted, manifestUris;
    [ annotationData, converted ] = maybeToArray(annotationData, true);

    // extract all manifest URIs and add them to `annotationData`
    annotationData = annotationData.map((ann) => {
      ann.on.manifestUri = canvasUriToManifestUri(ann.on.full);
      return ann;
    })

    // get all distinct manifest URIs, and insert them.
    manifestUris = [...new Set(
      annotationData.map((ann) => ann.on.manifestUri)
    )];
    // NOTE: PERFORMANCE significantly drops because of this: test running for the entire app goes from ~1000ms to ~2600ms
    const
      insertResponse = await this.manifestsPlugin.insertManifestsFromUriArray(manifestUris, false),
      /** @type {string[]} concatenation of ids of newly inserted manifests and previously inserted manifests. */
      insertedManifestsIds = insertResponse.insertedIds.concat(insertResponse.preExistingIds || []);

    // 3. update annotations with 2 things:
    //  - where manifest insertion has failed, set `annotation.on.manifestUri` to undefined
    //  - set `annotation.on.canvasIdx`: the position of the target canvas within the manifest, or undefined if it cound not be found.
    annotationData = await Promise.all(
      annotationData.map(async (ann) => {
        ann.on.manifestUri =
          // has the insertion of `manifestUri` worked ? (has it returned a valid response, woth `insertedIds` key).
          insertedManifestsIds.find((x) => x === ann.on.manifestUri)
            ? ann.on.manifestUri
            : undefined;
        ann.on.canvasIdx =
          ann.on.manifestUri
            ? await this.manifestsPlugin.getCanvasIdx(ann.on.manifestUri, ann.on.full)
            : undefined;
        return ann;
      })
    );

    // retroconvert array to single object, if single object was converted.
    return converted
      ? annotationData[0]
      : annotationData;
  }

  ////////////////////////////////////////////////////////////////
  // insert / updates

  /**
   * validate and insert a single annotation.
   * @param {object} annotationArray
   * @returns {Promise<InsertResponseType>}
   */
  async insertAnnotation(annotation) {
    annotation = this.#cleanAnnotation(annotation);
    annotation = await this.#insertManifestsAndGetCanvasIdx(annotation);
    return this.insertOne(annotation);
  }

  /**
   * TODO: handle side effects when changing `annotation.on`: changes that can affect `manifestShortId`, `manifestUri` and `canvasIdx`
   *    (for example, updating `annotation.on.full` would ask to change `canvasIdx`).
   * @param {object} annotation
   * @returns {Promise<UpdateResponseType>}
   */
  async updateAnnotation(annotation) {
    // necessary: on insert, the `@id` received is modified by `this.#cleanAnnotationList`.
    annotation = this.#cleanAnnotation(annotation, true);
    const
      query = { "@id": annotation["@id"] },
      update = { $set: annotation };
    return this.updateOne(query, update);
  }

  /**
   * validate and insert annotations from an annotation list.
   * @param {object} annotationList
   * @returns {Promise<InsertResponseType>}
   */
  async insertAnnotationList(annotationList) {
    let annotationArray;
    annotationArray = this.#cleanAnnotationList(annotationList);
    annotationArray = await this.#insertManifestsAndGetCanvasIdx(annotationArray);
    return this.insertMany(annotationArray);
  }

  ////////////////////////////////////////////////////////////////
  // delete

  /**
   * @param {AnnotationsDeleteKeyType} deleteKey - what deleteVal describes: an annotation's '@id', a manifest's URI...
   * @param {string} deleteVal - deletion key
   * @returns {Promise<DeleteResponseType>}
   */
  async deleteAnnotations(deleteKey, deleteVal) {

    const allowedDeleteKey = [ "uri", "manifestShortId", "canvasUri" ];
    if ( !allowedDeleteKey.includes(deleteKey) ) {
      throw this.deleteError(`${this.funcName(this.deleteAnnotations)}: expected one of ${allowedDeleteKey} for param 'deleteKey', got '${deleteKey}'`)
    }

    const deleteFilter =
      deleteKey==="uri"
        ? { "@id": deleteVal }
        : deleteKey==="canvasUri"
          ? { "on.full": deleteVal }
          : { "on.manifestShortId": deleteVal };

    return this.delete(deleteFilter);
  }

  ////////////////////////////////////////////////////////////////
  // get

  /**
   * find documents based on a `queryObj` and project them to `projectionObj`.
   *
   * about projection: 0 removes the fields from the response, 1 incldes it (but exclude all others)
   * see: https://www.mongodb.com/docs/drivers/node/current/crud/query/project/#std-label-node-project
   *      https://stackoverflow.com/questions/74447979/mongoservererror-cannot-do-exclusion-on-field-date-in-inclusion-projection
   * @param {object} queryObj
   * @param {object?} projectionObj - extra projection fields to tailor the reponse format
   * @returns {Promise<object[]>}
   */
  async find(queryObj, projectionObj={}) {
    // 1. construct the final projection object, knowing that we can't mix exclusive and inclusive projectin.
    // presence of `_id` will not cause projections to fail => remove it from values.
    const projectionValues =
      Object.entries(projectionObj)
        .filter(([k,v]) => k !== "_id")
        .map(([k,v]) => v);

    // if there are projection values defined and if they're not 0 or 1, then they're invalid => throw
    if ( projectionValues.length && projectionValues.find((x) => ![0,1].includes(x)) ) {
      throw this.readError(`Annotations2.find: only allowed values for projection are 0 and 1. got: ${[...new Set(projectionValues)]}`)
    }
    // mongo projection can be either inclusive (define only fields that will be included) or negative (define only fields that will be excluded), but not a mix of the 2. if you have more than 1 distinct values, you mixed inclusion and exclusion => throw
    const distinctProjectionValues = [...new Set(projectionValues)]
    if ( distinctProjectionValues.length > 1 ) {
      throw this.readError(`Annotations2.find: can't mix insertion and exclusion projection in 'projectionObj'. all values must be either 0 or 1. got: ${distinctProjectionValues}`, projectionObj)
    }
    // negative projection: all fields will be included except for those specified.
    // in this case, negate other fields that we don't ant exposed.
    // in case of positive projection, no specific processing is required: only the explicitly required fields are included.
    // in all cases, `_id` should not be included unless we explicitly ask for it.
    projectionObj._id = projectionObj._id || 0;
    if ( distinctProjectionValues[0] === 0 ) {
      projectionObj["on.manifestShortId"] = projectionObj["on.manifestShortId"] || 0;
    }

    // 2. find, project and return
    return this.collection
      .find(queryObj, { projection: projectionObj })
      .toArray();
  }

  /**
   * implementation of the IIIF Search API 1.0
   *
   * NOTE:
   *  - only `motivation` and `q` search params are implemented
   *  - to increase search execution, ONLY EXACT STRING MACHES are
   *    implemented for `q` and `motivation` (in the IIIF specs, you can supply
   *    multiple space-separated values and the server should return all partial
   *    matches to any of those strings.)
   *
   * see:
   *  https://iiif.io/api/search/1.0/
   *  https://github.com/Aikon-platform/aiiinotate/blob/dev/docs/specifications/4_search_api.md
   *
   * @param {string} queryUrl
   * @param {string} manifestShortId
   * @param {string} q
   * @param {"painting"|"non-painting"|"commenting"|"describing"|"tagging"|"linking"} motivation
   * @returns {object} annotationList containing results
   */
  async search(queryUrl, manifestShortId, q, motivation) {
    const
      queryBase = { "on.manifestShortId": manifestShortId },
      queryFilters = { $and: [] };

    // expand query parameters
    if ( q ) {
      queryFilters.$and.push({
        $or: [
          { "@id": q },
          { "resource.@id": q },
          { "resource.chars": q }
        ]
      });
    }
    if ( motivation ) {
      queryFilters.$and.push(
        motivation === "non-painting"
          ? { motivation: { $ne: "sc:painting" } }
          : motivation === "painting"
            ? { motivation: "sc:painting" }
            : { motivation: `oa:${motivation}` }
      );
    }
    const query =
      queryFilters.$and.length
        ? { ...queryBase, ...queryFilters }
        : queryBase;

    const annotations = await this.find(query);
    return toAnnotationList(annotations, queryUrl, `search results for query ${queryUrl}`);
  }

  /**
   * find all annotations whose target (`on.full`) is `canvasUri`.
   * @param {string} canvasUri
   * @param {boolean} asAnnotationList
   * @returns
   */
  async findByCanvasUri(queryUrl, canvasUri, asAnnotationList=false) {
    const annotations = await this.find({
      "on.full": canvasUri
    });
    return asAnnotationList
      ? toAnnotationList(annotations, queryUrl, `annotations targeting canvas ${canvasUri}`)
      : annotations;
  }

  /**
   * find an annotation by its "@id"
   * @param {string} annotationUri
   * @returns {Promise<object>}  the annotation, or `{}` if none was found
   */
  async findById(annotationUri) {
    return this.collection.findOne({ "@id": annotationUri })
  }

}

export default fastifyPlugin((fastify, options, done) => {
  fastify.decorate("annotations2", new Annotations2(fastify));
  done();
}, {
  name: "annotations2",
  dependencies: ["manifests2"]
})