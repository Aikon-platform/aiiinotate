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


## Notes

### Uniqueness

As of writing (25.09.25), there are no uniqueness constraints on collections. Ideally, we would want to avoid having duplicate annotations or manifests in the database. 

This is more complicated in practice: at least for `annotions2`, an annotation's `@id` field is re-generated and a random part (an UUID) is generated at insert time. This means that, when trying to store the same annotation (with the same `@id`), the `@id` is changed, and so a different value is inserted. 

This means that we can't have a uniqueness constraint on `@id` or `id` fields of our collections. Another option would be to have a uniqueness constraint on annotation targets (no 2 annotations can annotate the same region), but this behaviour seems brittle in practice, so it's not yet implemented.
