# Development notes: IIIF compatibility and variations between IIIF prsentation APIxs 3.x and IIIF 2.x

The annotation server uses an internal data model that can convert to and from annotation models defined in IIIF 2.x and 3.x presentation API. Respectively:
- IIIF 3.x follows the [W3C Web Annotations standard (WA)](https://www.w3.org/TR/annotation-model/)
- IIIF 2.x follows the [Open Annotations standard (OA)] (http://www.commonsemantics.com/oa/Open%20Annotation%20Data%20Model%20Primer.html#examples)

In general, there are [breaking changes](https://iiif.io/api/presentation/3.0/change-log/#1-breaking-changes) between IIIF 2.x and 3.x. For annotations, the OA model allows things that are not possible in WA, and vice versa. Our internal data model tries to store a maximum amount of data from WA and OA annotations, and then do the necessary conversion to produce valid OA/WA annotations.

To make things funnier, the original Open Annotations standard website is no longer available.

## Annotations and the `motivation` attribute

### The problem

Both OA and WA have a `motivation` attribute that describes the function of the annotation in relation to the Manifest. Mainly, the use of `painting` (WA) / `sc:painting` (OA) indicates that the annotation is the primary content of the canvas and should be rendered.
- WA allows 2 values: `painting`, `supplementing`
- OA allows a more values and defines an ontology. [IIIF 2.1 specifies](https://iiif.io/api/presentation/2.1/#comment-annotations) that the value given to a non-painting annotation should be `oa:commenting`

In practice, in SAS/Aikon, non-painting annotations have the `motivation`: `[ "oa:tagging", "oa:supplementing" ]`.

### What we do

In an annotation, the `motivation` field is a `string[]` array that accepts all values it receives.
- **when writing data from IIIF to DB**, `motivation` values are connected to string arrays but are not verified.
- **when converting data from DB to IIIF**, `motivation` values stored in the database are processed:
    - converting to IIIF 2.x:
        - if WA values are stored in the DB, they are converted to 2.x: `painting => sc:painting`, `supplementing => oa:commenting`.
        - if OA values are stored in the DB, they are kept as is
    - converting to IIIF 3.x:
        - if WA values are in the DB, they are kept as is
        - if OA values are in the DB, they are converted to `painting` (if `sc:painting` is in the array of motivations stored) or `commenting` otherwise.

