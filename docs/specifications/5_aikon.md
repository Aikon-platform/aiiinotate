# AIKON NEEDS

Hre we desribe the functionnalities our annotation server should implement, and list which functionnalities are aldready implemented by SAS.

---

## Reminders

- in Aikon, a Regions corresponds to a regions extraction on a document, and that Regions extrction corresponds to a IIIF manifest. 1 manifest => 1 regions extraction
- IIIF and SAS specific code in Aikon is stored in [front.app.webapp.utils.iiif](https://github.com/Aikon-platform/aikon/tree/main/front/app/webapp/utils/iiif)
- in AIKON, IIIF manifests aren't stored in the app. Instead, they are generated dynamically and served when needed.
    - IIIF and SAS specific code in Aikon is stored in [front.app.webapp.utils.iiif](https://github.com/Aikon-platform/aikon/tree/main/front/app/webapp/utils/iiif)
    - see [front.app.webapp.utils.iiif.manifests](https://github.com/Aikon-platform/aikon/blob/main/front/app/webapp/utils/iiif/manifest.py)
    - *note: IIIF manifests are stored by SAS, because SAS needs the manifests. In the app however, we don't use the SAS stored manifests*

---

## Implemented by SAS

### Fetch data

- get all manifests stored in SAS
    - SAS route: `GET /manifests`
- get all annotations / implement a IIIF search API. 
    - SAS route: `GET /search-api/$manifestId/search`
    - if we don't implement a full search API, we can use this route to return all annotations for a manifest
- get all annotations for a single canvas
    - SAS route: `GET /annotation/search/?uri=$canvasUri`, where `$canvasUri` is the URI of the canvas for which we want the annotatione

### Create / update data

- import a new IIIF manifest 
    - SAS route: `POST /manifests`, where the body is the new IIIF manifest
- import an AnnotationList 
    - SAS route: `POST /annotation/populate`, where the body is either an URI pointing to an AnnotationList, or the AnnotationList itself

### Delete data

- delete a manifest (actually not 100% sure that this is implemented by SAS)
    - sas route: `DELETE /manifests`
- delete an annotation
    - sas route: `DELETE /annotation/destroy/?uri=$annotationUri` where `$annotationUri` is the ID of the annotation to delete

### Provided by SAS but not currently used in AIKON:

- `POST /annotation/create`: crate a single annotation
- `POST /annotation/update`: update a single annotation

---

## Not implemented by SAS

### Fetch data

- get all annotations for a single manifest ([code](https://github.com/Aikon-platform/aikon/blob/cc8430c52e205e6a1c04c4ae84f69126fb5a3bda/front/app/webapp/utils/iiif/annotation.py#L32)).
    - this behaviour is implemented by SAS but results are paginated which requires to run several queries
- get the total number of annotations in a single manifest ([code](https://github.com/Aikon-platform/aikon/blob/cc8430c52e205e6a1c04c4ae84f69126fb5a3bda/front/app/webapp/utils/iiif/annotation.py#L648))

### Create / update data

- index all annotations for a manifest ([code](https://github.com/Aikon-platform/aikon/blob/cc8430c52e205e6a1c04c4ae84f69126fb5a3bda/front/app/webapp/utils/iiif/annotation.py#L197)).

### Delete data

- unindex a manifest ([code](https://github.com/Aikon-platform/aikon/blob/cc8430c52e205e6a1c04c4ae84f69126fb5a3bda/front/app/webapp/utils/iiif/annotation.py#L769))
- remove all annotations for a single manifest in 1 query ([code](https://github.com/Aikon-platform/aikon/blob/cc8430c52e205e6a1c04c4ae84f69126fb5a3bda/front/app/webapp/utils/iiif/annotation.py#L798)). currently, we need to 
    - loop over each canvas in a manifest
    - loop over each annotation in a manifest
    - delete that annotation in an HTTP request => tons of HTTP requests

### Other

- annotations should be ordered by their position on the page (or have a method that returns annotations ordered)



