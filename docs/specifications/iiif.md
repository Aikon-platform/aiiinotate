# IIIF ANNOTATIONS

## Specifications

- web annotation data model [here](https://www.w3.org/TR/annotation-model/)
- image API docs [here](https://iiif.io/api/image/3.0/)
- presentation API 2.x [here](https://iiif.io/api/presentation/2.1/) (most widely used)
- presentation API 3.0 [here](https://iiif.io/api/presentation/3.0/) (newest version)
- annotations API docs [here](https://iiif.io/api/annex/openannotation/)

---

## Image API

[https://iiif.io/api/image/3.0/](https://iiif.io/api/image/3.0/)

The Annotation API is based on the IIIF image api. As a reminder, the IIIF image URL anatomy is:

```
{scheme}://{server}{/prefix}/{identifier}/{region}/{size}/{rotation}/{quality}.{format}
```

---

## Web annotation data model

[https://www.w3.org/TR/annotation-model/](https://www.w3.org/TR/annotation-model/)

### In general

- an annotation is composed of 2 connected ressources:
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

### Vocabulary

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

### Annotations

#### Description

- an Annotation is directed graph describing a relationship between 2 types of resources: 
    - Bodies
    - Targets 
- an Annotation has 0..n Bodies and 1..n Targets. it typically has 1 Body and 1 Target.
- Annotations, Bodies and Targets MAY have their own properties and relationships

#### Data model

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

### External Web resource

An EWR is identified by an IRI and has properties. All properties of an EWR MAY be contained within the annotation itself. In the example below, 

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

#### Targets and Bodies

- they MUST be identified by an IRI, but the Resource described by a Target or Body MAY be more specific than its IRI (a T or B can be a segment of a resource, a specific state of it, a T or B can have a specific role in an annotation...)

// J'EN SUIS À 3.2.2 CLASSES

---

## Annotation API

[https://iiif.io/api/annex/openannotation](https://iiif.io/api/annex/openannotation)


