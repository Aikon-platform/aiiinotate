# Dev progress

We mostly talk about which routes are done here

---

## Done

### Routes

Routes are only implemented with IIIF Presentation API 2.x, not with the 3.0 version.

#### Generic routes

- `GET /search-api/:iiifSearchVersion/manifests/:manifestShortId/search`: search API

#### Annotations routes

- `GET /annotations/:iiifPresentationVersion/search`: get all annotations for a canvas URI
- `POST /annotations/:iiifPresentationVersion/create`: create 1 annotation
- `POST /annotations/:iiifPresentationVersion/createMany`: create several annotations
- `POST /annotations/:iiifPresentationVersion/update`: update 1 annotation
- `DELETE /annotations/:iiifPresentationVersion/delete`: delete annotations, either by their `@id`, trget canvas URI (`on.full`), or their `on.manifestShortId`

=> all create/update/delete annotation routes are done !

#### Manifests routes

- `POST /manifests/:iiifPresentationVersion/create`: create a single manifest, either by including the manifest in the body or its URI
- `DELETE /manifests/:iiifPresentationVersion/delete`: delete a single manifest
- `GET /manifests/:iiifPresentationVersion`: return an index of all manifests as a collection

### Non-routes

- `manifests2`: `insert`, `insertMany` internal behaviours
- fetching and inserting manifests related to an annotation when using inserting annotations.

---
