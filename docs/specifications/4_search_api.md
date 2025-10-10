# IIIF Search API

Search API 1.0 (aligned with IIIF 2.1): [https://iiif.io/api/search/1.0/](https://iiif.io/api/search/1.0/)

Search API 2.0 (aligned with IIIF 3.0): [https://iiif.io/api/search/2.0/](https://iiif.io/api/search/2.0/)

The search API allows to query IIIF contents, such as a manifest, an annotation list/page or an annotation.

--- 

## Versions

- Search API 1.0 is aligned with IIIF Presentation API 2.1. Query responses are `AnnotationLists`.
- Search API 2.0 is aligned with IIIF Presentation API 3.1. Query responses are `AnnotationPages`.

Other than that, the 2 APIs are pretty similar, so they are presented together.

---

## Scope

IIIF Search is scoped: the IIIF search is made available by including a `service description` in part of a IIIF manifest (the manifest itself, an annotation list/page...)

### Search API 1.0

`@id` contains the URI where the search can be performed.

{
  // ... the resource that the search service is associated with ...
  "service": {
    "@context": "http://iiif.io/api/search/1/context.json",
    "@id": "http://example.org/services/identifier/search",
    "profile": "http://iiif.io/api/search/1/search"
  }
}

### Search API 2.0

`id` contains the URI where the search can be performed.

```js
{
  // ... the resource that the search service is associated with ...
  "service": [
    {
      "id": "https://example.org/services/identifier/search",  // the URL where to run the search
      "type": "SearchService2"
    }
  ]
}
```

---

## Search URL anatomy

```
GET https://example.org/services/identifier/search?q={...}&motivation={...}&date={...}&user={...}
```

Where:

- `q`: space-separated list of search terms. Those will be searched in Textual Bodies or URIs.
- `motivation`: space-separated list of motivations, queried in the `motivation` / `oa:motivation` fields.
- `date`: space-separated list of creation date ranges in `start/end` ISO8601 format: `YYYY-MM-DDThh:mm:ssZ/YYYY-MM-DDThh:mm:ssZ`. In IIIF 2.1, will be searched in the `dc:created` field of annotations.
- `user`: URI that identifies the user that created an annotation.

`q` MUST be implemented, `motivation` SHOULD be implemented, the others MAY be implemented.

*Example: `https://example.org/service/manifest/search?q=bird&motivation=painting`*

---

## Responses

### Search API 1.0

- the response MUST be in an `AnnotationList`
- `@id` MUST be the query URI
- results are an array of `Annotations` in the `resources` key.

More personnalisation can be done (pagnination, search-specific data in the AnnotationList, autocomplete etc.) but it's out of scope compared to our aims.

```js
{
  "@context":"http://iiif.io/api/presentation/2/context.json",
  "@id":"http://example.org/service/manifest/search?q=bird&motivation=painting",
  "@type":"sc:AnnotationList",

  "resources": [
    {
      "@id": "http://example.org/identifier/annotation/anno-line",
      "@type": "oa:Annotation",
      "motivation": "sc:painting",
      "resource": {
        "@type": "cnt:ContentAsText",
        "chars": "A bird in the hand is worth two in the bush"
      },
      "on": "http://example.org/identifier/canvas1#xywh=100,100,250,20"
    }
    // Further matching annotations here ...
  ]
}
```

### Search API 2.0

- the response MUST be an AnnotationPage
- `@id` MUST be the query URI
- annotations MUST be embedded in the response

It's possible to implement pagination and autocomplete, but this is out of bounds here.

```js
{
  "@context": "http://iiif.io/api/search/2/context.json",
  "id": "https://example.org/service/manifest/search?q=bird&motivation=painting",
  "type": "AnnotationPage",

  "items": [
    {
      "id": "https://example.org/identifier/annotation/anno-line",
      "type": "Annotation",
      "motivation": "painting",
      "body": {
        "type": "TextualBody",
        "value": "A bird in the hand is worth two in the bush",
        "format": "text/plain"
      },
      "target": "https://example.org/identifier/canvas1#xywh=100,100,250,20"
    }
    // Further matching annotations here ...
  ]
}
```
