# Endpoints

## Introductory notes

### Terminology

In the docs below,

- `Parameters` describes route parameters (dynamic segments of a route's URL).
- `Query` describes the query string in a key-value format

### IIIF Version

**aiiinotate** is meant to be able to handle both IIIF presentation APIs: the most common [2.x](https://iiif.io/api/presentation/2.1) and the more recent [3.x](https://iiif.io/api/presentation/3.0). Both APIs define a data structure for manifests, annotations, lists of annotations and collections of manifests.

**HOWEVER, in aiiinotate, IIIF Presentation v2 and v3 data are isolated**: they form two separate collections, and no conversion is done between IIIF 2.x and 3.x data. This means that:
- **when communicating with aiiinotate**, you must specify a **IIIF presentation version in the query URL**. In the docs, this is described by the  `iiif_version` keyword.
- **when inserting/updating data**, the data structure you provide must match the URL's `iiif_version`: you can't insert an annotation in v3 if your `iiif_version` is `2`.
- **when searching for data**, if you inserted an annotation in v3, you must search for it with `iiif_version = 3`.
- **TLDR**:
    - your data must match the `iiif_version` argument
    - if you insert an Annotation following the API v3.x, you can't search for it using `iiif_version=2`.

This is because
- the IIIF standard is quite complex and there are breaking changes between v2 and v3
- handling conversions between v2 and v3 is error prone, would increase calculations and slow the app down

---

## Generic routes

### IIIF search API

```
GET /search-api/{iiif_version}/manifests/{manifest_short_id}/search
```

Implementation of the [IIIF Search API](https://iiif.io/api/search/2.0/), to search one or several annotations within a manifest.

#### Request

- Parameters:
    - `iiif_version` (`2 | 3`): the IIIF aearch API version. 2 is for IIIF Presentation API 3.x, 1 is for IIIF Presentation API 2.x
    - `manifest_short_id` (`string`): the ID of the manifest. See the *IIIF URIs* section.
- Query:
    - `q` (`string`): query string.
        - if `iiif_version=1`, `q` is searched in the fields: `@id`, `resource.@id` or `resource.chars` fields
    - `motivation` (`painting | non-painting | commenting | describing | tagging | linking`): values for the `motivation` field of an annotation
    - `canvasMin` (`number`): a positive integer
    - `canvasMax` (`number`): a positive integer
        - `canvasMax` must be greater than `canvasMin`
        - if `canvasMax` is undefined, then we will only return the annotations that target a canvas at the `canvasMin` position in its manifest.
    - `page` (`number`): results are paginated. This specifies the page number
    - `pageSize` (`number`): number of annotations to display per page. Defaults to `process.env.AIIINOTATE_PAGE_SIZE`.
    - `onlyIds` (`boolean`): return just the value of `@id` fields of matched annotations as a `string[]` instead of returning all the annotations. If `onlyIds=true`, there is no pagination, `page` and `pageSize` won't have any effect.

#### Response

```
AnnotationList | AnnotationPage | string[]
```

- if `onlyIds=true`, return a `string[]` (array of the IDs of all matched annotations)
- otherwise,
    - if `iiif_version` is `1`, return an `AnnotationList`
    - else, return an `AnnotationPage`.

#### Notes

- `canvasMin`, `canvasMax` and `onlyIds` are non-standard query parameters that are NOT part of the IIIF Search API specification.
- If `q` and `motivation` are unused, it will return all annotations for the manifest
- Only exact matches are allowed for `q` and `motivation`
- About `canvasMin` and `canvasMax`:
    - they are used to search for annotations that target a range of canvases: for example, fetch all anotations between pages 3 and 30 of a manuscript.
    - See section **Create/update an annotation** for more information and possible issues with canvas indexes.

---

### Delete an annotation or a manifest

```
DELETE /{collection_name}/{iiif_version}/delete
```

#### Request

- Parameters:
    - `collection_name` (`annotations | manifests`): delete an annotation or a manifest
    - `iiif_version` (`2 | 3`): IIIF presentation version
- Query:
    - if `collection_name = manifests`:
        - `uri`: the full URI of the manifest to delete
        - `manifestShortId`: the manifest's identifier
    - if `collection_name = annotation`:
        - `uri`: the full URI of the annotation to delete
        - `manifestShortId`: a manifest's identifier, to delete all annotations for a manifest
        - `canvasUri`: the full URI to an annotation's target canvas, to delete all annotatons for the canvas

#### Response

```
{ deletedCount: <integer> }
```

---

## Manifests routes

### Get an index of all manifests

```
GET /manifests/{iiif_version}
```

Returns a Collection of all manifests in your **aiiinotate** instance.

#### Request

- Parameters:
    - `iiif_version` (`2 | 3`): the IIIF Presentation API version

#### Response

A IIIF `Collection`, following the IIIF Presentation API 2 or 3, depending of the value of `iiif_version`.

---

### Insert a manifest

```
POST /manifests/{iiif_version}/create
```

#### Request

- Parameters:
    - `iiif_version` (`2 | 3`): the IIIF Presentation API version of your manifest
- Body (`JSON`): the manifest  to index in the database

#### Response

```
{
    insertedIds: string[],
    preExistingIds: string[],
    rejectedIds: []
}
```

- `insertedIds`: the list of IDs of inserted manifests
- `preExisingIds`: the IDs of manifests that were aldready in the database
- `rejectedIds`: the IDs of manifests on which an error occurred

---

## Annotation routes

### Get all annotations for a canvas

```
GET /annotations/{iiif_version}/search
```

#### Request

- Parameters:
    - `iiif_version` (`2 | 3`): the IIIF Presentation API of your manifests
- Query:
    - `canvasUri` (`string`): the URI of the target canvas
    - `page` (`number`): results are paginated. Specifies the page number.
    - `pageSize` (`number`): number of items per page. Defaults to `process.env.AIIINOTATE_PAGE_SIZE`.

#### Response

Results are paginated.

```
AnnotationList | AnnotationPage
```

---

### Count annotations

```
GET /annotations/{iiif_version}/count
```

#### Request

- Parameters:
    - `iiif_version` (`2 | 3`): the IIIF Presentation API of your manifests
- Query:
    - `uri` (`string`): the annotation's `@id`
    - `canvasUri` (`string`): the annotation's target canvas (`on.full`)
    - `manifestShortId` (`string`): the short ID of the annotation's target manifest (`on.manifestShortId`)

#### Response

```
{ count: integer }
```

---

### Get a single annotation

```
GET /data/{iiif_version}/{manifest_short_id}/annotation/{annotation_short_id}
```

This route allows to query an annotation by its ID by defering its `@id | id` field. This URL follows the IIIF specification

#### Request

- Parameters:
    - `iiif_version` (`2 | 3`): the IIIF version of the annotation
    - `manifest_short_id` (`string`): the identifier of the manifest the annotation is related to
    - `annotation_short_id`: the unique part of the annotation URL

#### Response

`Object`: the annotation. Its format follows the IIIF Presentation specification 2 or 3, based on the value of `iiif_version`.

---

### Create/update an annotation

```
POST /annotations/{iiif_version}/{action}
```

Create or update a single annotation

#### Request

- Parameters:
    - `iiif_version` (`2 | 3`): the IIIF version of the annotation
    - `action` (`create | update`): the action to perform: create or update an annotation
- Query:
    - `throwOnCanvasIndexError` (`boolean`): if there is an error fetching the related manifest, or getting a target canvas' index, throw an error.
- Body (`Object`): a IIIF annotation that follows the IIIF Presentation API 2 or 3 (depending on the value of `iiif_version`)

#### Response

```
{
    insertedIds: string[],
    preExistingIds: string[],
    rejectedIds: string[],
    fetchErrorIds: string[]
}
```

#### Notes

- A side effect of inserting annotations is inserting the related manifests.
- When inserting an annotation, the annotation's target manifest is also fetched and inserted in the database
- Annotations in `aiiinotate` contain 3 nonstandard fields. In IIIF presentation 2.x,
    - `annotation.on[0].manifestUri`: the URI of the manifest on which is an annotation
    - `annotation.on[0].manifestShortId`: the unique identifier of the manifest on which is an annotation
    - `annotation.on[0].canvasIdx`: the position of an annotation's target canvas within the target manifest, as an integer
    - this depends on reconstructing an annotation's target manifest URL and fetching it. If this process fails, the fields above will be `undefined`.
    - the annotation's target's manifest is fetched and inserted in the database, if possible, and stored in `annotation.on[0].manifestShortId`
- If `throwOnCanvasIndexError`, an error will be thrown if an error appears anywhere in the proicess of fetching the target manifest or populating the `canvasIdx` field.
    - fetching an annotation's target manfest is error prone: it depends on the manifest being available through HTTP, which is not in our control.
    - in turn, normally, if there's an error, we will just add the issue to `fetchErrorIds` and not throw.
    - in controlled environments where you know your manifests WILL be available and where you rely heavily on the `canvasIdx` field (like AIKON), throwing an error will ensure that the `canvasIdx` field is always defined.

---

### Insert several annotations

```
POST /annotations/{iiif_version}/createMany
```

Batch insert multiple annotations.

#### Request

- Query:
    - `iiif_version` (`2 | 3`): the IIIF version of the annotation
- Body: either:
    - a full `AnnotationList | AnnotationPage` embedded in the body (type must match `iiif_version`: AnnotationPage for IIIF 3, AnnotationList for IIIF 2).
    - `AnnotationList[] | AnnotationPage[]` (type must match `iiif_version`): an array of annotation lists or pages
    - `{ uri: string }`: an object containing a reference to an `AnnotationList` or `AnnotationPage`
    - `{ uri: string }[]`: an array of objects containing a reference to an `AnnotationList` or `AnnotationPage`.

#### Response

```
{
    insertedIds: string[],
    preExistingIds: string[],
    rejectedIds: []
}
```

#### Notes

- Be wary of maximum body size, especially when sending AnnotationLists in your body. If possible, using `{ uri: string }` is better.
- All annotations within a single AnnotationList/Page may have different target canvases or manifests.
- See **Create/update an annotation**.

---

## Appending 1: App logic: URL prefixes

URL anatomy is a mix of [SAS endpoints](./specifications/4_sas.md) and IIIF specifications. In turn, we define the following prefixes:

- `data`: for all IIIF URIs: URIs of annotations and annotation lists
- `annotations`: operations on annotations
- `manifests`: operations on manifests
- `search-api`: endpoint to access the IIIF search API

In turn, URL anatomy is:

```
{host}/{prefix}/{iiif_version}/{slug}
```

Where:
- `host`: the host of your app
- `prefix`: `data | annotations | manifests`
- `iiif_version`:
    - if `prefix` is `search-api`, `1 | 2`: IIIF Search API version used
    - otherwise, `2 | 3`, the IIIF Presentation API version your data is in
- `slug`: the rest of the qurty URI

There is an extra URL prefix: `schemas`. It is only used internally (not accessible to clients or accessible through HTTP) to define the IDs of all JsonSchemas, so we won't talk about it here.


---

## Appendix 2: IIIF URIs

IIIF URIs in the Presentation 2.1 API are:

```
Collection 	         {scheme}://{host}/{prefix}/collection/{name}
Manifest 	         {scheme}://{host}/{prefix}/{manifest_short_id}/manifest
Sequence 	         {scheme}://{host}/{prefix}/{manifest_short_id}/sequence/{name}
Canvas 	                 {scheme}://{host}/{prefix}/{manifest_short_id}/canvas/{name}
Annotation (incl images) {scheme}://{host}/{prefix}/{manifest_short_id}/annotation/{name}
AnnotationList           {scheme}://{host}/{prefix}/{manifest_short_id}/list/{name}
Range 	                 {scheme}://{host}/{prefix}/{manifest_short_id}/range/{name}
Layer 	                 {scheme}://{host}/{prefix}/{manifest_short_id}/layer/{name}
Content 	         {scheme}://{host}/{prefix}/{manifest_short_id}/res/{name}.{format}
```


