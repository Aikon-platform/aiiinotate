# Endpoints

---

## URL prefixes

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

## Generic routes

### IIIF search API

```
GET /search-api/{iiif_version}/manifests/{manifest_short_id}/search
```

Implementation of the [IIIF Search API](https://iiif.io/api/search/2.0/), to search one or several annotations within a manifest.

#### Query

- Variables:
    - `iiif_version` (`2 | 3`): the IIIF aearch API version. 2 is for IIIF Presentation API 3.x, 1 is for IIIF Presentation API 2.x
    - `manifest_short_id` (`string`): the ID of the manifest. See the *IIIF URIs* section. 
- Parameters:
    - `q` (`string`): query string. 
        - if `iiif_version=1`, `q` is searched in the fields: `@id`, `resource.@id` or `resource.chars` fields
    - `motivation` (`painting | non-painting | commenting | describing | tagging | linking`): values for the `motivation` field of an annotation

#### Reply

Returns a JSON. If `iiif_version` is `1`, an AnnotationList is returned. Otherwise, an AnnotationPage is returned.

#### Notes

- if `q` and `motivation` are unused, it will return all annotations for the manifest
- only exact matches are allowed for `q` and `motivation`

---

## Annotation routes

--- 

## Manifests routes



---

## IIIF URIs

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


