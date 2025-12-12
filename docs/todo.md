# TODO

## Short term

- **pagination**
    - add pagination to responses (`next` field in AnnotationLists)
    - add `pageNumber` and `limit` parameters to routes to be able to specify page numbers and number of items in page from GET queries
- **update Mongo indexes** 
    - to reflect database changes (`annotation.on` is now an array)
    - on frequently queried fields (`annotation.on.canvasIdx`, `annotation.on.manifestShortId`... => see what else is used in GET routes)
- **sort annotations collections**
    - by `canvasIdx` 
    - by position on the page (y-offset then x-offset, see `xywh`)


## Mid term

- **aiiinotate CLI** to import and export data easily
- **IIIF presentation 3**
