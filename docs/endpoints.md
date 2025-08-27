# Endpoints

---

## URL prefixes

URL anatomy is a mix of [SAS endpoints](./specifications/4_sas.md) and IIIF specifications. In turn, we define the following prefixes:

- `data`: for all IIIF URIs: URIs of annotations and annotation lists
- `annotations`: operations on annotations
- `manifests`: operations on manifests

In turn, URL anatomy is:

```
{host}/{prefix}/{slug}
```

---

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


