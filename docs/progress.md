# Dev progress

We mostly talk about which routes are done here

## Done 

Routes are only implemented with IIIF Presentation API 2.x, not with the 3.0 version.

- `GET /search-api/:iiifSearchVersion/manifests/:manifestShortId/search`: search API
- `GET /annotations/:iiifPresentationVersion/search`: get all annotations for a canvas URI
- `POST /annotations/:iiifPresentationVersion/create`: create 1 annotation
- `POST /annotations/:iiifPresentationVersion/createMany`: create several annotations
- `POST /annotations/:iiifPresentationVersion/update`: update 1 annotation 
- `DELETE /annotations/:iiifPresentationVersion/delete`: delete annotations, either by their `@id`, trget canvas URI (`on.full`), or their `on.manifestShortId`

=> all create/update/delete annotation routes are done !
