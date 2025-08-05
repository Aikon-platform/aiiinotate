# IIIF ANNOTATIONS

## Specifications

- image API docs [here](https://iiif.io/api/image/3.0/)
- presentation API 2.x [here](https://iiif.io/api/presentation/2.1/) (most widely used)
- presentation API 3.0 [here](https://iiif.io/api/presentation/3.0/) (newest version)
- relationship to the W3C annotations data model [here](https://iiif.io/api/annex/openannotation/)
- IIIF annotation exmple [here](https://iiif.io/api/cookbook/recipe/0266-full-canvas-annotation/)

---

## Image API

[https://iiif.io/api/image/3.0/](https://iiif.io/api/image/3.0/)

The Annotation API is based on the IIIF image api. As a reminder, the IIIF image URL anatomy is:

```
{scheme}://{server}{/prefix}/{identifier}/{region}/{size}/{rotation}/{quality}.{format}
```

---

## Relation to the W3C Web Annotation model

[https://iiif.io/api/annex/openannotation](https://iiif.io/api/annex/openannotation)

IIIF is based on the W3C Web Annotation data model, and not just for the IIIF annotations but for all its APIs ! In IIIF annotations, document parts are targeted as `SpecificResource`. The IIIF standard defines several custom selectors to extend the W3C standard. 

### `ImageApiSelector`

Selects an image region in an Image API way. The selector is an *objectified* version of the Image API URL params:

- `type`: `"ImageApiSelector"`
    - must be "ImageApiSelector"
- `region`: 
    - default `"full"`
- `size`: 
    - default `"full"`
- `rotation`: 
    - default `"0"`
- `quality`: 
    - default `"default"`
- `format`: 
    - default `"jpg"`

```js
{
  "type": "SpecificResource",
  "source": "https://example.org/iiif/image1",
  "selector": {
    "type": "ImageApiSelector",
    "region": "pct:0,0,10,10",
    "rotation": "90"
  }
}
```

### `PointSelector`

Selects a Point in an image.

- `type`: `"PointSelector"`
- `x`, `y`: `int`
    - optional
    - integers giving the x and y-coordinates of the point
- `t`: `float`
    - optional 
    - float value describing the time at which the point appears (on a video), in seconds

```js
{
  "type": "PointSelector",
  "x": 10,
  "y": 10,
  "t": 14.5
}
```

### Content Selectors

Out of scope here, but there are `AudioContentSelector` and `VisualContentSelector` to select audio/visual content in a IIIF video.

---

## Presentation API (in general)

<table>
    <tr>
        <th>IIIF Presentation 3.0 data model</th>
        <th>IIIF Presentation 2.0 data model</th>
    </tr>
    <tr>
        <td><img src="./include/presentation_3.0_resize.png"></td>
        <td><img src="./include/presentation_2.0_white.png"></td>    
    </tr>
</table>

### Terminology

- embedded: a resource that is included in the same document as a parent resource, called the embedder
- referenced: a resource that is not (entierly) present in another resource, and for which it is necessary to fetch the referenced resource's id to retrieve information

### Differences between 2.0 and 3.0:

- 2.0 is mostly aimed at image documents (books), 3.0 also allows for audio-video documents
- ressources `AnnotationCollection` and `AnnotationPage` exist only in 3.0, and `Sequence` and `AnnotationList` exist only in 2.x.
- (image) annotations in the 2.0 specification follow the Open Annotations standard, while 3.0 follows the W3C Web Annotations standard, derived from the former.
- 3.0 is more modular and allows for more embedded ressources.
- some vocabularies and attributes are embedded (`@id` attribute in 2.0 become `id` in 3.0, `oa:Annotation` value in `2.0` becomes `Annotation` in 3.0, `sc:painting` value in 2.0 becomes `painting` in 3.0)

---

## Presentation API 3.0

> NOTE: only some general informations on the manifest's structure and the way images are embedded in the manifest is included.

### Ressource types

- `Collection`: an ordered list of Manifests or Collections of Manifests
- `Manifest`: a description of the structure and properties of the compound object (book...)
- `Range`: an ordered list of Canvases, or Range of Canvases
- `Canvas`: a virtual container that represents a particular view of the object and has content resources associated to it. The Canvas allows to describe how content is laid out on it, spatially and temporally. Annotations are used to populate the Canvas with images, text, sound...
- `Annotation Collection`: a list of Annotation Pages that allows higher level-groupings (different ttranscriptions of a single text may each get their Annotation Collection)
- `Annotation Page`: an ordered list of Annotations associated with a Canvas. Annotation Pages can also provide commentary on a resource that is part of a canvas (like a text commentary for an image)
- `Annotation`: annotations are used to store a canvas' content: image, video, text...

### Images and Annotations in the manifest

The global structure is: 
> `Canvas / AnnotationPage[] / Annotation[]`

#### Canvas

The `Canvas` represents a single page (for a book) or a single view within a manifest. 
- `id` MUST be used and MUST be a URI identifying the canvas.
- `type`: `AnnotationPage`
- a canvas MAY be embedded or referenced within the parent manifest
- content is associated to a `Canvas` through Web annotations.
- `id` MUST be used and MUST be a URI identifying the canvas.
- `items` is the property containing a list of AnnotationPages  

```js
{
  // Metadata about this canvas
  "id": "https://example.org/iiif/book1/canvas/p1",
  "type": "Canvas",
  "label": { "none": [ "p. 1" ] },
  "height": 1000,
  "width": 750,

  "items": [
    {
      "id": "https://example.org/iiif/book1/content/p1/1",
      "type": "AnnotationPage",
      "items": [
        // Painting Annotations on the Canvas are included here
      ]
    }
  ],

  "annotations": [
    {
      "id": "https://example.org/iiif/book1/comments/p1/1",
      "type": "AnnotationPage",
      "items": [
        // Non-Painting Annotations on the Canvas are included here
      ]
    }

  ]
}
```

#### AnnotationPage

An `AnnotationPage` contains a list of annotations. 
- `id` MUST be used and MUST be a URI identifying the canvas.
- `type`: `AnnotationPage`
- the AnnotationPage MAY have any of the other properties defined in the Web Annotation specification
- an AnnotationPage may be embedded in the manifest, or referenced by the manifest.
    - if embedded, the property `items` contains a list of Annotations  
    - if referenced, the AnnotationPage 
        - MUST have the minimal structure `{"id": "<uri>","type": "AnnotationPage"}`
        - MUST NOT have the property `items`
        - MAY contain other properties

```js
{
  "@context": "http://iiif.io/api/presentation/3/context.json",
  "id": "https://example.org/iiif/book1/annopage/p1",
  "type": "AnnotationPage",

  "items": [
    {
      "id": "https://example.org/iiif/book1/annopage/p1/a1",
      "type": "Annotation"
      // ...
    },
    {
      "id": "https://example.org/iiif/book1/annopage/p1/a2",
      "type": "Annotation"
      // ...
    }
  ]
}
```

#### Annotation

**`Annotations`** store a canvas' content.
- annotations are contained within `AnnotationPage`s
- there are 2 types of Annotations: painting and non-painting Annotations. Painting Annotations will be rendered as the canvas' content while non-painting Annotations are *about* the canvas in another way. 
- `id` MUST be used and MUST be a URI
- `type`: `Annotation`
- `target` SHOULD contain a reference to the Canvas' `id`
- `motivation` is the property describing the role of the Annotation (painting or non-painting):
    - painting Annotations MUST have the attribute `motivation: "painting"` (rendered annotations ar the images that will be visible on the canvas)
    - informations derived from the Canvas's content (like the OCR of a text page) MUST be associated by an Annotation with `motivation: "supplementing"`
    - in short, content of any type may be associated with the Canvas via an Annotation that has the `motivation` value `painting`, meaning the content is part of the Canvas; an Annotation that has the `motivation` value `supplementing`, meaning the content is from the Canvas but not necessarily part of it; or an Annotation with another `motivation` meaning that it is somehow about the Canvas.

```js
{
  "@context": "http://iiif.io/api/presentation/3/context.json",
  "id": "https://example.org/iiif/book1/annotation/p0001-image",
  "type": "Annotation",
  "motivation": "painting",
  "body": {
    "id": "https://example.org/images/page1.jpg",
    "type": "Image"
  },
  "target": "https://example.org/iiif/book1/canvas/p1"
}
```

#### AnnotationCollection

The `AnnotationCollection` object is used to group sevral AnnotationPages that should be managed together, regardless of the Canvas resource they target. For example, an AnnotationCollection may be a single translation of a text, thus allowing to have several translation for a text.
- `id` MUST be used and MUST be an URI
- `label` SHOULD be used to display infor;ation the collection
- other properties MAY be used.

```js
{
  "@context": "http://iiif.io/api/presentation/3/context.json",
  "id": "https://example.org/iiif/book1/annocoll/transcription",
  "type": "AnnotationCollection",
  "label": {"en": ["Diplomatic Transcription"]},
  "first": { "id": "https://example.org/iiif/book1/annopage/l1", "type": "AnnotationPage" },
  "last": { "id": "https://example.org/iiif/book1/annopage/l120", "type": "AnnotationPage" }
}
```

---

## Presentation API 2.0

### Ressource types

- `Manifest`
- `Sequence`: the order of the views in the object. A manifest may contain several Sequences to describe multiple equally valid orders in the content
- `Canvas`: container for a single or view
- `Content`: content resources, such as image or text associated with a canvas.

### Images in the manifest

#### Canvas

A `Canvas` represents a single view within the manifest. It is a 2D rectangular shape with a defined `width` and `height` defined as positive integers.
- images are linked to a canvas as Annotatios that are embedded in the `images` property
- `images` stores the image annotations
- `otherContent` stores references to other annotation lists: transcriptions, commentary etc.
- an canvas MAY be embedded or referenced from the manifest by an URI.

```js
{
  // Metadata about this canvas
  "@context": "http://iiif.io/api/presentation/2/context.json",
  "@id": "http://example.org/iiif/book1/canvas/p1",
  "@type": "sc:Canvas",
  "label": "p. 1",
  "height": 1000,
  "width": 750,
  "thumbnail" : {
    "@id" : "http://example.org/iiif/book1/canvas/p1/thumb.jpg",
    "@type": "dctypes:Image",
    "height": 200,
    "width": 150
  },
  "images": [
    {
      "@type": "oa:Annotation"
      // Link from Image to canvas should be included here, as below
    }
  ],
  "otherContent": [
    {
      // Reference to list of other Content resources, _not included directly_
      "@id": "http://example.org/iiif/book1/list/p1",
      "@type": "sc:AnnotationList"
    }
  ]

}
```

#### Image resource

Image ressources are Annotations linked to the canvas.
- `@id` MAY be used to identify the image and SHOULD be an HTTP URI if used
- `motivation` MUST be used and its value MUST be `sc:painting` to distinguish it from non-painting annotations
- `resource` is the property linking the image itself to the annotation
    - `@id` MUST be used and MUST be the URI at which the image is accessed and the URI MAY be a IIIF image URI.
    - `@type: "dtypes:Image"` shuld be used
    - `format` may be used to describe the image's mediatype
    - `on` attribute MUST be used and the value MUST be the Canvas' `@id`

```js
{
  "@context": "http://iiif.io/api/presentation/2/context.json",
  "@id": "http://example.org/iiif/book1/annotation/p0001-image",
  "@type": "oa:Annotation",
  "motivation": "sc:painting",
  "resource": {
    "@id": "http://example.org/iiif/book1/res/page1.jpg",
    "@type": "dctypes:Image",
    "format": "image/jpeg",
    "service": {
      "@context": "http://iiif.io/api/image/2/context.json",
      "@id": "http://example.org/images/book1-page1",
      "profile": "http://iiif.io/api/image/2/level2.json"
    },
    "height":2000,
    "width":1500
  },
  "on": "http://example.org/iiif/book1/canvas/p1"
}
```

#### AnnotationList

`AnnotationList`s are used to add additional resources to the canvas: the full text of the object... 
- they are collections of annotatins
- they MUST be referenced from the canvas they are associated with by an URI. they MUST NOT be embedded in the manifest. 
    - they SHOULD be loaded by the client when they are encountered. 
    - separation between Canvas and AnnotationList allows to accelerate loading time for the manifest (it is lighter since it does not contain all extra annotations).

URI pattern : `{scheme}://{host}/{prefix}/{identifier}/list/{name}`
- `{name}` MUST identify uniquely the list. the name MAY be the canvas' name, but since a canvas may have several annotations it must not be assumed that the list's and the canvas' name will be the same.

Properties of the annotation list are:
- `@id`: MUST be the HTTPS URI used to access the AnnotationList
- `resources` is a list of annotations
    - each resource MUST be something other than an image if the `motivation` is `sc:painting` (a Canvas' painting images is defined by its `images` key)
    - `on` property MUST be used and point to the canvas' `@id`
    - `format` SHOULD be included and MUST be the ressource's media type
    - `motivation` is used to describe the role of the resource. if the resource is to be rendered it MUST be `sc:painting` (such as images, text transcriptions, performances of music from the manuscript and so forth)
    - other possible properties are: `label`, `description`, `metadata`, `license` and `attribution`

```js
{
  "@context": "http://iiif.io/api/presentation/2/context.json",
  "@id": "http://example.org/iiif/book1/list/p1",
  "@type": "sc:AnnotationList",

  "resources": [
    {
      "@type": "oa:Annotation",
      "motivation": "sc:painting",
      "resource":{
        "@id": "http://example.org/iiif/book1/res/music.mp3",
        "@type": "dctypes:Sound",
        "format": "audio/mpeg"
      },
      "on": "http://example.org/iiif/book1/canvas/p1"
    },
    {
      "@type": "oa:Annotation",
      "motivation": "sc:painting",
      "resource":{
        "@id": "http://example.org/iiif/book1/res/tei-text-p1.xml",
        "@type": "dctypes:Text",
        "format": "application/tei+xml"
      },
      "on": "http://example.org/iiif/book1/canvas/p1"
    }
    // ... and so on
  ]
}
```

---

## Annotations

https://training.iiif.io/iiif-online-workshop/day-four/annotations-and-annotation-lists.html

https://iiif.io/api/cookbook/recipe/0266-full-canvas-annotation/

--- 

### Useful links
