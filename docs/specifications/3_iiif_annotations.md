# IIIF ANNOTATIONS

This document focuses on the way annotations are handled in IIIF. For a more general on IIIF APIs, see [this document](./2_iiif_apis.md)

---

## Sources

- [IIIF 3.0 annotation example](https://iiif.io/api/cookbook/recipe/0266-full-canvas-annotation/)
- [IIIF annotations tutorial](https://training.iiif.io/iiif-online-workshop/day-four/annotations-and-annotation-lists.html)
- step 4 of [this tutorial](https://training.iiif.io/iiif-online-workshop/day-four/annotation-linking.html) explains how to link annotations to a manifest in 2.x

---

## TLDR

In `Presentation API 3.0`, non-painting Annotations (i.e, textual annotations) are included in Canvases using the `annotations`. The structure of a canvas is then:

```
canvas
 |_items       : AnnotationPage[]  // painting annotations. embedded
 |_annotations : AnnotationPage[]  // non-painting annotations. should be referenced
```

In `Presentation API 2.x`, non-painting Annotations are included in canvases using the `otherContent` key:

```
canvas
 |_images       : Annotation[]      // painting annotations. embedded
 |_otherContent : AnnotationList[]  // non-painting annotations. should be referenced
```

---

## Presentation API 3.0

The structre of an AnnotationPage is: 

```js
{
  "@context": "http://iiif.io/api/presentation/3/context.json",
  "id": "https://example.org/iiif/book1/annopage/p1",
  "type": "AnnotationPage",

  "items": [
    // annotations go here
 ]
}
```

The structure of an annotation is:

```js
{
  "@context": "http://iiif.io/api/presentation/3/context.json",
  "id": "https://example.org/iiif/book1/annotation/p0001-image",
  "type": "Annotation",
  "motivation": "painting",
  "body": {
    "type": "TextualBody",
    "value" : "<p>What a lovely annotation</p>",
    "format" : "text/html",
    "language" : "fr"
  },
  "target": "https://example.org/iiif/book1/canvas/p1"
}
```

---

## Presentation API 2.x

The structure of an AnnotationList is:

```js
{
  "@context": "http://iiif.io/api/presentation/2/context.json",
  "@id": "http://example.org/iiif/book1/list/p1",
  "@type": "sc:AnnotationList",

  "resources": [
    // annotations go here 
  ] 
}
```

And the structure of an Annotation is (with some extra metadata):

```js
{
  "@id" : "http://aikon.enpc.fr/sas/annotation/wit90_pdf105_anno195_c10_69f692ce732f42698208c05515d085de",
  "@type" : "oa:Annotation",
  "resource" : {
    "@type" : "dctypes:Text",
    "format" : "text/html",
    "chars" : "<p>What a lovely annotation</p>",
  },
  "on" : "https://aikon.enpc.fr/aikon/iiif/v2/wit90_pdf105_anno195/canvas/c10.json#xywh=258,591,1016,738",
  "motivation" : [ "oa:tagging", "oa:commenting" ],
  "@context" : "http://iiif.io/api/presentation/2/context.json",
  "label" : ""
  }
```
