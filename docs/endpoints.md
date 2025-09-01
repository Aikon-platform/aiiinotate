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

--

## IIIF URIs

IIIF URIs in the Presentation 2.1 API are:

```
Collection 	         {scheme}://{host}/{prefix}/collection/{name}
Manifest 	         {scheme}://{host}/{prefix}/{identifier}/manifest
Sequence 	         {scheme}://{host}/{prefix}/{identifier}/sequence/{name}
Canvas 	                 {scheme}://{host}/{prefix}/{identifier}/canvas/{name}
Annotation (incl images) {scheme}://{host}/{prefix}/{identifier}/annotation/{name}
AnnotationList           {scheme}://{host}/{prefix}/{identifier}/list/{name}
Range 	                 {scheme}://{host}/{prefix}/{identifier}/range/{name}
Layer 	                 {scheme}://{host}/{prefix}/{identifier}/layer/{name}
Content 	         {scheme}://{host}/{prefix}/{identifier}/res/{name}.{format}
```


