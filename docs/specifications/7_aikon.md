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
- get all annotations for a specific canvas
- get all annotations for a range of canvases
- have several "export format" for an annotation:
    - IIIF annotation of course
      ```
      {
            "@id" : "http://aikon.enpc.fr/sas/annotation/wit69_man69_anno134_c179_23f885ed66914139ab7d67d22f8f8f46",
            "@type" : "oa:Annotation",
            "dcterms:created" : "2025-03-03T14:40:57",
            "dcterms:modified" : "2025-03-03T14:40:57",
            "resource" : {
              "@type" : "dctypes:Text",
              "format" : "text/html",
              "chars" : "<p></p>",
              "https://aikon.enpc.fr/sas/full_text" : "",
              "https://iscd.huma-num.fr/sas/full_text" : ""
            },
            "on" : "https://aikon.enpc.fr/aikon/iiif/v2/wit69_man69_anno134/canvas/c179.json#xywh=52,1221,891,54",
            "motivation" : [ "oa:tagging", "oa:commenting" ],
            "@context" : "http://iiif.io/* TLSv1.2 (IN), TLS header, Supplemental data (23):
        api/presentation/2/context.json",
            "label" : ""
      }
      ```
    - standardized metadata (used in application for svelte) (e.g. `https://iscd.huma-num.fr/vhs/witness/2339/regions/canvas`)
      ```
      r_annos[canvas][aid] = {
            "id": aid,
            "ref": f"{img}_{xywh}",
            "class": "Region",
            "type": get_name("Regions"),
            "title": region_title(canvas, xywh),
            "url": gen_iiif_url(img, res=f"{xywh}/full/0"),
            "canvas": canvas,
            "xywh": xywh.split(","),
            "img": img,
      }
      ```
    - only ids
      ```
      manifest_annotations.extend(
          annotation["@id"] for annotation in annotations["resources"]
      )
      ```
    - API url list (e.g. [`https://iscd.huma-num.fr/vhs/witness/2339/regions/canvas`](https://iscd.huma-num.fr/vhs/wit249_man249_anno249/list/))
      ```
      "wit249_man249_0021_695,1020,123,214": "https://iscd.huma-num.fr/iiif/2/wit249_man249_0021.jpg/695,1020,123,214/full/0/default.jpg",
      "wit249_man249_0021_880,1032,421,135": "https://iscd.huma-num.fr/iiif/2/wit249_man249_0021.jpg/880,1032,421,135/full/0/default.jpg",
      "wit249_man249_0021_167,1282,505,770": "https://iscd.huma-num.fr/iiif/2/wit249_man249_0021.jpg/167,1282,505,770/full/0/default.jpg",
      "wit249_man249_0021_308,1179,220,236": "https://iscd.huma-num.fr/iiif/2/wit249_man249_0021.jpg/308,1179,220,236/full/0/default.jpg",
      "wit249_man249_0021_207,1013,468,149": "https://iscd.huma-num.fr/iiif/2/wit249_man249_0021.jpg/207,1013,468,149/full/0/default.jpg"
      ```

### Create / update data

- index all annotations for a manifest in 1 query ([code](https://github.com/Aikon-platform/aikon/blob/cc8430c52e205e6a1c04c4ae84f69126fb5a3bda/front/app/webapp/utils/iiif/annotation.py#L197)).

### Delete data

- unindex a manifest ([code](https://github.com/Aikon-platform/aikon/blob/cc8430c52e205e6a1c04c4ae84f69126fb5a3bda/front/app/webapp/utils/iiif/annotation.py#L769))
- remove all annotations for a single manifest in 1 query ([code](https://github.com/Aikon-platform/aikon/blob/cc8430c52e205e6a1c04c4ae84f69126fb5a3bda/front/app/webapp/utils/iiif/annotation.py#L798)). currently, we need to 
    - loop over each canvas in a manifest
    - loop over each annotation in a manifest
    - delete that annotation in an HTTP request => tons of HTTP requests

### Other

- annotations should be ordered by their position on the page (or have a method that returns annotations ordered)
- store rectangular annotations (bounding boxes) as well as polygonal annotations
- annotation should have their canvas number as standard metdata (for now we need to parse `canvas = anno["on"].split("/canvas/c")[1].split(".json")[0]` 😰)
- make annotations ordered not alphabetically (137 arriving before 14) but by canvas order


