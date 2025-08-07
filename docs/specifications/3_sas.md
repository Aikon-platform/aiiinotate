# SIMPLE ANNOTATION SERVER

---

## Sources

- [official docs](https://github.com/glenrobson/SimpleAnnotationServer/tree/master/doc)
- [endpoints](https://github.com/glenrobson/SimpleAnnotationServer/blob/master/doc/Endpoints.md)
- [IIIF annotations search](https://github.com/glenrobson/SimpleAnnotationServer/blob/master/doc/IIIFSearch.md)

--- 

## Endpoints

```
GET /search-api/$manifestShortId/search
```
- IIIF search API URL
- `$manifestShortId` is the manifest's ID
- search parameters are [as per the IIIF docs](https://iiif.io/api/search/2.0/#request-1): 
    - `q`: query string, searched in the annotation's textual body or its URI
    - `motivation`: search through each annotation's `motivation` key
    - `date`: date ranges
    - `users`: the usrs who edited the annotation
- if no parameters are supplied, all annotations are returned
- *example: `https://aikon.enpc.fr/sas/search-api/wit9_man11_anno165/search?q=`*


```
GET /annotation/search?uri=$canvasUri
```
- show all annotations for a canvas
- `$canvasUri` is the URI for the canvas we want annotations for
- *example: `https://aikon.enpc.fr/sas/annotation/search?uri=https://aikon.enpc.fr/aikon/iiif/v2/wit9_man11_anno165/canvas/c16.json#xywh=0,31,1865,1670` shows annotations for canvas `https://aikon.enpc.fr/aikon/iiif/v2/wit9_man11_anno165/canvas/c16.json#xywh=0,31,1865,1670`*

```
POST /annotation/populate
```
- import an AnnotationList into SAS
- POST body: the IIIF AnnotationList

```
POST /annotation/create
```
- create an annotation
- POST body:

```
POST /annotation/update
```
- update an annotation
- POST body: IIIF Annotation
    - the annotation's `@id` should point to an annotation that exists in the store

```
DELETE /annotation/destroy/?uri=$annotationUri
```
- delete an annotation
- `$annotationUri` is the `@id` of the annotation to delete


