# SIMPLE ANNOTATION SERVER

---

## Sources

- [official docs](https://github.com/glenrobson/SimpleAnnotationServer/tree/master/doc)
- [endpoints](https://github.com/glenrobson/SimpleAnnotationServer/blob/master/doc/Endpoints.md)
- [IIIF annotations search](https://github.com/glenrobson/SimpleAnnotationServer/blob/master/doc/IIIFSearch.md)

--- 

## Endpoints

### Fetch data

#### IIIF search API
```
GET /search-api/$manifestShortId/search
```
- `$manifestShortId` is the manifest's ID
- search parameters are [as per the IIIF docs](https://iiif.io/api/search/2.0/#request-1): 
    - `q`: query string, searched in the annotation's textual body or its URI
    - `motivation`: search through each annotation's `motivation` key
    - `date`: date ranges
    - `users`: the usrs who edited the annotation
- if no parameters are supplied, all annotations are returned
- *example: https://aikon.enpc.fr/sas/search-api/wit9_man11_anno165/search?q=*

#### Show all annotations for a canvas
```
GET /annotation/search?uri=$canvasUri
```
- `$canvasUri` is the URI for the canvas we want annotations for
- *example: https://aikon.enpc.fr/sas/annotation/search?uri=https://aikon.enpc.fr/aikon/iiif/v2/wit9_man11_anno165/canvas/c16.json#xywh=0,31,1865,1670 shows annotations for canvas https://aikon.enpc.fr/aikon/iiif/v2/wit9_man11_anno165/canvas/c16.json#xywh=0,31,1865,1670*

#### List all indexed IIIF manifests
```
GET /manifests
```

### Create/Update data

#### Populate / Import an AnnotationList into SAS
```
POST /annotation/populate
```
- POST body: the AnnotationList to import can be passed dirctly or as an URI to the AnnotationList (see [SAS source code](https://github.com/glenrobson/SimpleAnnotationServer/blob/dc7c8c6de9f4693c678643db2a996a49eebfcbb0/src/main/java/uk/org/llgc/annotation/store/Populate.java#L46)):
    - `{ "uri": $annotationListUri }`, where `$annotationListUri` is an URI pointing to a IIIF annotations list
    - IIIF AnnotationList

#### Create an annotation
```
POST /annotation/create
```
- POST body: IIIF Annotation

#### Update an annotation
```
POST /annotation/update
```
- POST body: IIIF Annotation
    - the annotation's `@id` should point to an annotation that exists in the store

#### Index a new manifest 
```
POST /manifests
```
- POST body: IIIF Manifest

### Delete data

#### Delete an annotation
```
DELETE /annotation/destroy/?uri=$annotationUri
```
- `$annotationUri` is the `@id` of the annotation to delete

#### Unindex a manifest
```
DELETE /manifests/$manifestId
```
- `$manifestId` is the short manifest identifier
- actually I'm not 100% sure it is implemented by SAS but we [would need it](https://github.com/Aikon-platform/aikon/blob/cc8430c52e205e6a1c04c4ae84f69126fb5a3bda/front/app/webapp/utils/iiif/annotation.py#L769)
