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

---

## Annotations

### Description

- an Annotation is directed graph describing a relationship between 2 types of resources:
    - Bodies
    - Targets
- an Annotation has 0..n Bodies and 1..n Targets. it typically has 1 Body and 1 Target.
- Annotations, Bodies and Targets MAY have their own properties and relationships

### Data model

- property `@context`:
    - `"http://www.w3.org/ns/anno.jsonld"` MUST be in the context, or the entire context. if there's only this value, it MUST be provided as a string
- property `id`: `string`
    - the IRI identifying the resource
- property `type`:
    - Relationship describing the type of the annotation.
    - accepts 1+ values. if it has only 1 value, it MUST be `"Annotation"`
- relationship `body`:
    - accepts 0..n values, but there SHOULD be at least 1 body
    - the Body MAY be embedded in the annotation, or it is an IRI pointing to an EWR
- relationship `target`:
    - accepts 0..n values, but there SHOULD be at least 1 body
    - the Target MUST be an IRI pointing to an EWR

```
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

### Embedded Web Resources

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

- `id`: the IRI identifying the body or target.
    - if the `id` identifies a segment of an EWR (i.e., part of an image), the IRI's `fragment` should identify the specific part of the resource that is being targeted. Example: `{"id": "http://example.com/image1#xywh=100,100,300,300"}`
    - for more fine-grained ways to retrieve part of a Resource, see [Specific Resources](https://www.w3.org/TR/annotation-model/#specific-resources), which allows to specify CSS selectors, XPATH...
- `type`:
    - the type attribute of a target or body describes the class it belongs to.
    - allowed values are: `Dataset | Image | Video | Sound | Text`
- `format`: the mimetype of the resource. not to be confused with `type`, that describes the general class the EWR

### String body `bodyValue`

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

### Embedded textual body `TextualBody`

To include metafdata with an embedded body, use the Embedded textual body construct. Embedded textual body attributes are:

- `id`: the IRI of the body. this attribute MAY be used to identify the textual body
- `type`:
    - it SHOULD have the value `"TextualBody"` and may have other classes
    - the class `TextualBody` indicates that the body is embedded within the annotation
- `value`:
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
- when there is 0 body, the attribute `body | bodyValue` is omitted. an annotation with no body is semantically similar to highlighting part of a resource
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
- `id`: the IRI of the Choice
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
