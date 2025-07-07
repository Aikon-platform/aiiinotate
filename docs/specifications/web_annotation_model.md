# Web annotation data model

[https://www.w3.org/TR/annotation-model/](https://www.w3.org/TR/annotation-model/)

The IIIF format is an implementation of the W3C's Web Annotation Data Model

---

## In general

- an annotation is composed of 2 connected resourrces:
    - a body: the annotation content
    - a target: the Web resource being annotated
- the Web annotation format is a single data model that satisfies most annotation use cases.
- it is implemenation-independant
- its design is based on linked data, but can be used outside of that context
- annotations are expressed in JSON-LD

A basic annotation can look like:

```js
{
  "@context": "http://www.w3.org/ns/anno.jsonld",
  "id": "http://example.org/anno1",
  "type": "Annotation",
  "body": "http://example.org/post1",
  "target": "http://example.com/page1"
}
```
---

## Vocabulary

- **IRI**: like URIs except that IRIs allow for unicode characters, whereas URIs are limited to ASCII
- **Resource**: an item of interest that MAY be identified by an URI
- **Web resource**: a Resource that MUST be identified by an IRI
- **External Web Resource (EWR)**: a Web resource that is outside of the current Resource, to which an IRI points. for example, the Target of an Annotation is an EWR.
- **Property**: a feature of a Resource, often with a specific data type, that is not a Relationship
- **Relationship**: a specific Property that is a reference to another resource (using its IRI, or describing it)
- **Class**: a group of resources. a class is a Web resource itself (identified by an IRI)
- **Instance**: a resource that belongs to a specific class
- **Type**: a Relationship that associates a class Instance to the class itself
- **SpecificResource**: a Target or Body that is more specific than the Resource identified by an IRI:
    - the SpecificResource refers to the source resource and the constraints that make it more specific.
    - examples: a specific segment or state, a T or B that plays a specific role in the annotation...
- **AnnotationCollection**: an ordered list of annotations

---

## Annotations

### Description

- an Annotation is directed graph describing a relationship between 2 types of resources:
    - Bodies
    - Targets
- an Annotation has 0..n Bodies and 1..n Targets. it typically has 1 Body and 1 Target.
- Annotations, Bodies and Targets MAY have their own properties and relationships

### Annotations data model

- `@context`: `IRI | IRI[]`
    - `"http://www.w3.org/ns/anno.jsonld"` MUST be in the context, or the entire context. if there's only this value, it MUST be provided as a string
- `id`: `string`
    - the IRI identifying the resource
- `type`: `string | string[]`
    - Relationship describing the type of the annotation.
    - accepts 1+ values. if it has only 1 value, it MUST be `"Annotation"`
- `body`: `IRI | Object`
    - accepts 0..n values, but there SHOULD be at least 1 body
    - the Body MAY be embedded in the annotation, or it is an IRI pointing to an EWR
- `target`: `Object | IRI`
    - accepts 0..n values, but there SHOULD be at least 1 body
    - the Target MUST be an IRI pointing to an EWR, or a SpecificResource

```js
// a complete annotation
{
  "@context": "http://www.w3.org/ns/anno.jsonld",
  "id": "http://example.org/anno1",
  "type": "Annotation",
  "body": "http://example.org/post1",
  "target": "http://example.com/page1"
}
```

---

## Bodies and targets

### External Web Resources

An EWR is identified by an IRI and has properties. It is a pattern used to reference content external to the annotation JSON.

Targets MUST be EWRs and Bodies MAY be EWRs.
- they MUST be identified by an IRI
- the Resource described by a Target or Body MAY be more specific than its IRI: a T or B can be:
    - a segment of a resource,
    - a specific state of it,
    - a T or B can have a specific role in an annotation
    - for specific ways to target part of a Resource, see [Specific Resources](https://www.w3.org/TR/annotation-model/#specific-resources), which allows to specify CSS selectors, XPATH...

All properties of an EWR MAY be contained within the annotation itself. In the example below, the IRIs point to the EWR to access, while all other properties are described in the annotation's body.

```js
// Beatrice records a long analysis of a patent, and publishes the audio on her website as an mp3. She then creates an Annotation with the mp3 as the body, and the PDF of the patent as the target.
// here, the properties of the Body and Target are recorded within the Annotation itself
{
  "@context": "http://www.w3.org/ns/anno.jsonld",
  "id": "http://example.org/anno2",
  "type": "Annotation",
  "body": {
    "id": "http://example.org/analysis1.mp3",
    "format": "audio/mpeg",
    "language": "fr"
  },
  "target": {
    "id": "http://example.gov/patent1.pdf",
    "format": "application/pdf",
    "language": ["en", "ar"],
    "textDirection": "ltr",
    "processingLanguage": "en"
  }
}
```

### General attributes of a Body or Target

- `id`: `IRI` 
    - the IRI identifying the body or target.
    - if the `id` identifies a segment of an EWR (i.e., part of an image), the IRI's `fragment` should identify the specific part of the resource that is being targeted. Example: `{"id": "http://example.com/image1#xywh=100,100,300,300"}`
    - for more fine-grained ways to retrieve part of a Resource, see [Specific Resources](https://www.w3.org/TR/annotation-model/#specific-resources), which allows to specify CSS selectors, XPATH...
- `type`: `string`
    - the type attribute of a target or body describes the class it belongs to.
    - allowed values are: `Dataset | Image | Video | Sound | Text`
- `format`: `mimetype` 
    - the mimetype of the resource. not to be confused with `type`, that describes the general class of the EWR

### String body (`bodyValue`)

In a lot of cases, the annotation's body is just an HTML string. In those cases, the Body may not be an EWR and can be included directly in the annotation, to avoid fetching content from external sources. 

The simplest body is a plain string. It is expressed using `bodyValue` attribute.
- it MUST NOT have any metadata associated with it. For metadata (`format`, `language`...), use `TextualBody`
- it MUST be interpretable as `text/plain` (not HTML)

```js
// complete annotation with a string body
{
  "@context": "http://www.w3.org/ns/anno.jsonld",
  "id": "http://example.org/anno6",
  "type": "Annotation",
  "bodyValue": "Comment text",
  "target": "http://example.org/target1"
}
```

### Embedded textual body (`TextualBody`)

To include metafdata with an embedded body, use the Embedded textual body construct. Embedded textual body attributes are:

- `id`: `IRI`
    - the IRI of the body. this attribute MAY be used to identify the textual body
- `type`: `string | string[]`
    - it SHOULD have the value `"TextualBody"` and may have other classes
    - the class `TextualBody` indicates that the body is embedded within the annotation
- `value`: `string`
    - the value MUST be used. it contains the content of the body.

`TextualBody` should be preffered over `bodyValue`.

```js
{
  "@context": "http://www.w3.org/ns/anno.jsonld",
  "id": "http://example.org/anno5",
  "type": "Annotation",
  "body": {
    "type" : "TextualBody",
    "value" : "<p>j'adore !</p>",
    "format" : "text/html",
    "language" : "fr"
  },
  "target": "http://example.org/photo1"
}
```

And the equivalent in `bodyValue` (note that HTML markup is removed)

```js
{
  "@context": "http://www.w3.org/ns/anno.jsonld",
  "id": "http://example.org/anno5",
  "type": "Annotation",
  "bodyValue": "j'adore !,
  "target": "http://example.org/photo1"
}
```

### Cardinality (number of bodies and targets)

An annotation can have 0+ bodies and 1+ targets.
- when there is 0 body, the attribute `body | bodyValue` is omitted. an annotation with no body is semantically similar to highlighting part of a resource.
- when there are 2+ bodies or targets, the `body` and `target` attributes are mapped to an array.
- when there are several bodies/targets, each body is related to each target individually


```js
// annotation without a body.
{
  "@context": "http://www.w3.org/ns/anno.jsonld",
  "id": "http://example.org/anno8",
  "type": "Annotation",
  "target": "http://example.org/img.jpg#xywh=100,100,300,300"
}
```

```js
// annotation with several bodies and targets
{
  "@context": "http://www.w3.org/ns/anno.jsonld",
  "id": "http://example.org/anno9",
  "type": "Annotation",
  "body": [
    "http://example.org/description1",
    {
      "type": "TextualBody",
      "value": "tag1"
    }
  ],
  "target": [
    "http://example.org/image1",
    "http://example.org/image2"
  ]
}
```

### Choice

The class `Choice` allows to select only one resourrce from an array. The client MAY use any algorithm to decide which resource to use. Otherwise, it MAY require the uer to make the decision.

Attribures are:
- `id`: `string`
    - the IRI of the Choice
- `type`: `Choice`.
    - A Choice resourrce MUST have only 1 value and the only allowed value is `Choice`
- `items`: `[]`
    - the list of resources to choose from. The 1st option is the default.

```js
{
  "@context": "http://www.w3.org/ns/anno.jsonld",
  "id": "http://example.org/anno10",
  "type": "Annotation",
  "body": {
    "type": "Choice",
    "items": [
      {
        "id": "http://example.org/note1",
        "language": "en"
      },
      {
        "id": "http://example.org/note2",
        "language": "fr"
      }
    ]
  },
  "target": "http://example.org/website1"
}
```

---

## Specific Resources

A `SpecificResource` allows to target a section with more precision than just an IRI and its fragment: CSS selectors, XPATH, text range...
- it is used in between the Body and Target
- they MAY be EWRs with their IRIs, but it is better to include them inside the annotation to avoid extra queries
- possible types of specificities (categories of Specific Resources) are: `Purpose | Selector | State | Style | Rendering | Scope`

### Specific resources data model

- `id`: `IRI`
    - the SpecificResource's IRI (optional)
- `type`: `SpecificResource`
    - it SHOULD have `SpecificResource` value and MAY have other values too
- `source`: `IRI | Object`
    - the relationship between SecificResource and the Resource it represents.
    - there MUST be exactly 1 source, described in detail or identified by its IRI.
- `purpose`: optional
    - describe the motivation for the annotation
- `selector`: `string | string[] | object | object[]`
    - may be a string, an object or an array of strings or objects
    - custom selectors for the annotation
    - there MAY be 0+ selectors
    - multiple selectors SHOULD select the same content

```js
// a SpecificResource with "tagging" purposes


{
  "@context": "http://www.w3.org/ns/anno.jsonld",
  "id": "http://example.org/anno18",
  "type": "Annotation",
  "body": {
    "type": "SpecificResource",
    "purpose": "tagging",
    "source": "http://example.org/city1"
  },
  "target": {
    "id": "http://example.org/photo1",
    "type": "Image"
  }
}
```

### Selectors data model


Other attributes specific to a certain type of selector are possible.
- `type`:  `string`
    - the type of selector we are using
    - a selector MUST have only 1 value
    - possible values are: `FragmentSelector | CssSelector | XPathSelector | TextQuoteSelector | TextPositionSelector | DataPositionSelector | SvgSelector | RangeSelector`
- `value`: `string`
    - the content of the selector
    - a selector MUST have only 1 value
- `refinedBy`: `IRI | Object`
    a selector within a selector to augment specificity of a selector.

```js
// the Target is a SpecificResource with a CSS selector
{
  "@context": "http://www.w3.org/ns/anno.jsonld",
  "id": "http://example.org/anno21",
  "type": "Annotation",
  "body": "http://example.org/note1",
  "target": {
    "source": "http://example.org/page1.html",
    "selector": {
      "type": "CssSelector",
      "value": "#elemid > .elemclass + p"
    }
  }
}
```

```js
// the Target is a SpecificResource that points to "annotation" preceded by "this is an " and suffixed by " that has some"
{
  "@context": "http://www.w3.org/ns/anno.jsonld",
  "id": "http://example.org/anno23",
  "type": "Annotation",
  "body": "http://example.org/comment1",
  "target": {
    "source": "http://example.org/page1",
    "selector": {
      "type": "TextQuoteSelector",
      "exact": "anotation",
      "prefix": "this is an ",
      "suffix": " that has some"
    }
  }
}
```

```js
// refinedBy in action: 1st selector targets a fragment, second selector targets a quote
{
  "@context": "http://www.w3.org/ns/anno.jsonld",
  "id": "http://example.org/anno29",
  "type": "Annotation",
  "body": "http://example.org/comment1",
  "target": {
    "source": "http://example.org/page1",
    "selector": {
      "type": "FragmentSelector",
      "value": "para5",
      "refinedBy": {
        "type": "TextQuoteSelector",
        "exact": "Selected Text",
        "prefix": "text before the ",
        "suffix": " and text after it"
      }
    }
  }
}
```

---

## Annotation collections 

An annotation Collection
- is an ordered list grouping annotations
- is divided in 2 sections: 
    - Annotation Collection manages the identify and description of the list (metadata that contextualises the collection and helps in its understanding)
    - Annotation Pages list all annotations that are members of the Collection. Each Page is an ordered list of Annotations.
- contains 0+ annotations
- MAY have multiple pages that are traversed through `first/last` (at collection level) and `prev/next` (at page level)

### Annotation Collection data model

- `@context`: `http://www.w3.org/ns/anno.jsonld`
    - MUST have one or more value and MUST contain the value `http://www.w3.org/ns/anno.jsonld`
- `id`: IRI
    - MUST have exactly 1 IRI that identifies the collection
- `type`: `AnnotationCollection`
    - MUST have 1+ types and MUST have the type `AnnotationCollection`
- `label`: `string | string[]`
    - a human readable label for the collection
    - SHOULD have 1+ labels 
- `total`: `int`
    - the number of Annotations in the collection
    - SHOULD be used
- `first`: the first Annotation Page
    - a Collection with >1 annotations MUST have a `first`
    - the first Annotation Page MAY be embedded within the Collection, or it MAY be an IRI
- `last`: the last Annotation Page
    - a Collection with >1 annotations SHOULD have a `last`
    - `last` is an IRI pointing to the last Annotation Page

```js
{
  "@context": "http://www.w3.org/ns/anno.jsonld",
  "id": "http://example.org/collection1",
  "type": "AnnotationCollection",
  "label": "Steampunk Annotations",
  "creator": "http://example.com/publisher",
  "total": 42023,
  "first": "http://example.org/page1",
  "last": "http://example.org/page42"
}
```

### Annotation Page data model

- `@context`: `IRI?`
    - if Page is not embedded in a collection, it MUST have 1+ values including `http://www.w3.org/ns/anno.jsonld`.
    - if Page is embedded, it SHOULD NOT have an `@context`
- `id`: IRI
    - an Annotation Page MUST have 1 IRI to identify it
- `type`: `AnnotationPage`
    - MUST have 1+ types, including `AnnotationPage`
- `partOf`: `IRI | Object`
    - the relation to the Collection
    - the Collection MAY be identified by its IRI or by an Object containing properties of the Collection and at least the Collection's `id`
- `items`: `[]`
    - the list of annotations on the Page.
    - MUST be used
- `next`: `IRI`
    - next Page related to the current Page in the Collection
    - MUST be used unless the current Page is the last one
- `prev`: `IRI`
    - previous page in the Collection
    - SHOULD be used unless the current Page is the first one
- `startIndex`: `int`
    - SHOULD be used, MUST be a single positive or null integer
    - represents the index of the 1st annotation on the page relative to all the annotations in the Collection

```js
{
  "@context": "http://www.w3.org/ns/anno.jsonld",
  "id": "http://example.org/page1",
  "type": "AnnotationPage",
  "partOf": {
    "id": "http://example.org/collection1",
    "label": "Steampunk Annotations",
    "total": 42023
  },
  "next": "http://example.org/page2",
  "startIndex": 0,
  "items": [
    {
      "id": "http://example.org/anno1",
      "type": "Annotation",
      "body": "http://example.net/comment1",
      "target": "http://example.com/book/chapter1"
    },
    {
      "id": "http://example.org/anno2",
      "type": "Annotation",
      "body": "http://example.net/comment2",
      "target": "http://example.com/book/chapter2"
    }
  ]
}
```

---

## Complete Example

```js
{
  "@context": "http://www.w3.org/ns/anno.jsonld",
  "id": "http://example.org/anno38",
  "type": "Annotation",
  "motivation": "commenting",
  "creator": {
    "id": "http://example.org/user1",
    "type": "Person",
    "name": "A. Person",
    "nickname": "user1"
  },
  "created": "2015-10-13T13:00:00Z",
  "generator": {
    "id": "http://example.org/client1",
    "type": "Software",
    "name": "Code v2.1",
    "homepage": "http://example.org/homepage1"
  },
  "generated": "2015-10-14T15:13:28Z",
  "stylesheet": {
    "id": "http://example.org/stylesheet1",
    "type": "CssStylesheet"
  },
  "body": [
    {
      "type": "TextualBody",
      "purpose": "tagging",
      "value": "love"
    },
    {
      "type": "Choice",
      "items": [
        {
          "type": "TextualBody",
          "purpose": "describing",
          "value": "I really love this particular bit of text in this XML. No really.",
          "format": "text/plain",
          "language": "en",
          "creator": "http://example.org/user1"
        },
        {
          "type": "SpecificResource",
          "purpose": "describing",
          "source": {
            "id": "http://example.org/comment1",
            "type": "Audio",
            "format": "audio/mpeg",
            "language": "de",
            "creator": {
              "id": "http://example.org/user2",
              "type": "Person"
            }
          }
        }
      ]
    }
  ],
  "target": {
    "type": "SpecificResource",
    "styleClass": "mystyle",
    "source": "http://example.com/document1",
    "state": [
      {
        "type": "HttpRequestState",
        "value": "Accept: application/xml",
        "refinedBy": {
          "type": "TimeState",
          "sourceDate": "2015-09-25T12:00:00Z"
        }
      }
    ],
    "selector": {
      "type": "FragmentSelector",
      "value": "xpointer(/doc/body/section[2]/para[1])",
      "refinedBy": {
        "type": "TextPositionSelector",
        "start": 6,
        "end": 27
      }
    }
  }
}
```
