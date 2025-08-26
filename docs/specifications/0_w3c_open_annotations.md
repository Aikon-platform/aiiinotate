# Open annotations data model

[https://web.archive.org/web/20220119101135/http://www.openannotation.org/spec/core](https://web.archive.org/web/20220119101135/http://www.openannotation.org/spec/core)

[https://web.archive.org/web/20221225112722/http://www.openannotation.org/spec/core/core.html](https://web.archive.org/web/20221225112722/http://www.openannotation.org/spec/core/core.html)

[https://www.w3.org/TR/annotation-vocab/](https://www.w3.org/TR/annotation-vocab/)


The IIIF 2.x standard relies on the W3C Open annotations (OA) standard. Established in 2013, it has since been deprecated in favour of the W3C's Web annotations model, described in the next section. To make things fun, the site is not longer available and must be accessed through the wayback machine.

---

## In general

- an Annotation is **a set of interconnected resources**, made mostly of a `Body` and a `Target`
- the data model is **implementation independant** and can be implemented in JSON, RDF-XML, Turtle...
- the standard extamples are in RDF, while IIIF uses JSON-ld. In  turn, keys vary from the IIIF standard. When there are differences, I indicate both what is in the OA examples, and what is used in IIIF.

---

## Vocabulary

- `Annotation`: a set of interconnected resources, with at its core a `Body` and a `Target`, where the `Body` is about the `Target`.
- `Target`: the object being annotated
- `Body`: the annotation's contents
- `Motivation`: the motivation further describes the relationship between `Body` and `Target`

--- 

## Namespaces

<table>
<tbody><tr><th>Prefix</th><th>Namespace</th><th>Description</th></tr>
<tr><td>oa</td><td>http://www.w3.org/ns/oa#</td> <td>The Open Annotation ontology</td></tr>

<tr><td>cnt</td><td>http://www.w3.org/2011/content#</td><td><a href="https://web.archive.org/web/20220119101135/http://www.w3.org/TR/Content-in-RDF10/">Representing Content in RDF</a></td></tr>
<tr><td>dc</td><td>http://purl.org/dc/elements/1.1/</td><td><a href="https://web.archive.org/web/20220119101135/http://dublincore.org/documents/dces/">Dublin Core Elements</a></td></tr>
<tr><td>dcterms</td><td>http://purl.org/dc/terms/</td><td><a href="https://web.archive.org/web/20220119101135/http://dublincore.org/documents/dcmi-terms/">Dublin Core Terms</a></td></tr>
<tr><td>dctypes</td><td>http://purl.org/dc/dcmitype/</td><td><a href="https://web.archive.org/web/20220119101135/http://dublincore.org/documents/dcmi-type-vocabulary/">Dublin Core Type Vocabulary</a></td></tr>
<tr><td>foaf</td><td>http://xmlns.com/foaf/0.1/</td><td><a href="https://web.archive.org/web/20220119101135/http://xmlns.com/foaf/spec/">Friend-of-a-Friend Vocabulary</a></td></tr>
<tr><td>prov</td><td>http://www.w3.org/ns/prov#</td><td><a href="https://web.archive.org/web/20220119101135/http://www.w3.org/TR/prov-o/">Provenance Ontology</a></td></tr>
<tr><td>rdf</td><td>http://www.w3.org/1999/02/22-rdf-syntax-ns#</td><td><a href="https://web.archive.org/web/20220119101135/http://www.w3.org/TR/rdf-syntax-grammar/">RDF</a></td></tr>
<tr><td>rdfs</td><td>http://www.w3.org/2000/01/rdf-schema#</td><td><a href="https://web.archive.org/web/20220119101135/http://www.w3.org/TR/rdf-schema/">RDF Schema</a></td></tr>
<tr><td>skos</td><td>http://www.w3.org/2004/02/skos/core#</td><td><a href="https://web.archive.org/web/20220119101135/http://www.w3.org/TR/skos-reference/">Simple Knowledge Organization System</a></td></tr>
<tr><td>trig</td><td>http://www.w3.org/2004/03/trix/rdfg-1/</td><td><a href="https://web.archive.org/web/20220119101135/http://www.w3.org/2004/03/trix/">TriG Named Graphs</a></td></tr>

</tbody></table>

---

## Annotations

An annotation has 1+ `Targets` and 0+ `Bodies`
- IIIF `@id`: `URI`
    - is used to identify with an URI the `Annotation`, `Body` and `Target`
    - in Turtle, there is no specific key because the standard is different.
- `a` (IIIF `@type`): `oa:Annotation`
    - this indicates that the resource is an `Annotation`
- `oa:hasBody` (IIIF `resource`): `Body | Body[]`
    - the relationship between `Annotation` and `Body`
    - the body MAY be omitted if there is no content to annotate
- `oa:hasTarget` (IIIF `on`): `Target | Target[]`
    - the relationship between `Annotation` and `Target`
- `oa:Motivation` (IIIF `motivation`): `string[]` (in IIIF, `oa:commenting | sc:painting` are frequent)
    - the motivation, or role of the annotation
    - `all allowed values are: `oa:bookmarking | oa:classifying | oa:commenting | oa:describing | oa:editing | oa:highlighting | oa:identifying | oa:linking | oa:moderating | oa:questionning | oa:replying | oa:tagging` 
    - in IIIF, `sc:painting` is also allowed to indicate a painting annotation. The most useful values are `sc:painting | oa:commenting`.  

```js
// basic structure
{
    "@id": "<URI>",
    "@type": "oa:Annotation",
    "motivation": "sc:painting" || "oa:commenting",  // or an array of values
    "resource": {
        "@id": "<URI?>",
        "@type": "<dctype>",
        // other keys
    },
    "on": "<URI>" || SpecificResource  // `on` can be either specified as the URI to a canvas, or as a SpecificResource
}
```
### Bodies and targets

- `a` (IIIF `@type`): `dctypes:Dataset | dctypes:Image | dctypes:MovingImage | dctypes:Sound | dcTypes:Text`
    - SHOULD be used to describe the type of a `Body` or `Target`
- IIIF `@id`: `URI`

Special cases:
- an annotation may have **no `Body`**
- an annotation may have **multiple `Bodies` or `Targets`**.
    - in that case, **each body is related to each target individually**. If we have 2 bodies and 2 targets, we have the following situation:  
    ```
    body1 <-> target1
    body1 <-> target2
    body2 <-> target1
    body2 <-> target2
    ```
    - you may have 1 `Target` and N `Bodies` (several annotations apply to a single body), or N `Target` and 1 `Bodies` (1 annotation applies to several images) or an N to N relationship. 

### Embedded textual body (ETB)

ETBs are used to embed textual content directly in an annotation instead of referencing it by an `id`.
- `a` (IIIF `@type`): `cnt:ContentAsText | dctypes:Text`
    - MUST be used to indicate that this is an ETB. MAY contain both values described above.
- `cnt:chars` (SAS `chars`): `string`
    - MUST Be used to contain the contents of the ETB.
- `dc:format` (SAS `format`): `mimetype`
    - SHOULD be used to describe the mimetype of the ETB
    - for example, it can distinguish plain text form HTML.
- `dc:language`: `string`
    - the language the ETB is in
    - language codes SHOULD follow [RFC 3066](https://www.ietf.org/rfc/rfc3066.txt)

```js
{
    "@type" : "dctypes:Text",
    "format" : "text/html",
    "chars" : "<p>This is en embedded textual content from SAS</p>",
}
```

### Tags

A tag is a specific type of `Body`: a keyword or label used to annotate a `Target`. There are 2 types of tags: "normal" and "semantic" tags
- `a` (IIIF `@type`): `oa:Tag | oa:SemanticTag`
    - `oa:Tag` describes a non-semantic tag. In that case, the tag functions like an ETB
    - `oa:SemanticTag` describes a semantic tag. Instead of containing the contents of the tag, the `Body` references an external URI.
- `oa:Motivation`: `oa:tagging`
    - `oa:tagging` should be added to the `oa:Motivation` of the annotation to indicate it's a tag

### Fragment URIs

Fragment URIs can be used to target part of a resource.
- fragments ARE NOT COMPATIBLE with `SpecificResources`. Either use one or the other.

```js
{
    "@id": "http://example.com/image.jpg#xywh=1,1,1,1"
}
```

---
 
## Specific Resources

[https://web.archive.org/web/20221225112722/http://www.openannotation.org/spec/core/specific.html](https://web.archive.org/web/20221225112722/http://www.openannotation.org/spec/core/specific.html)

`SpecificResources` are an extension of the core data model to reference part of a resource with more precision than Fragment URIs. They can be used either in `Bodies` or `Targets` (though in IIIF they are used mostly in `Targets`).

```js
// basic IIIF structure for a SpecificResource
{
    "@id": "<annotationId>",
    "@type": "oa:SpecificResource",
    "full": {
        // link to the full image
    },
    "selector": {
        "@type": "<selectorType>",
        "value": "<selectorValue>"
    },
    "within": {
        // extra context, such as the IIIF manifest in which to include the annotation 
    },
}
```

### Basic units

3 conceptual units are present in the Specific Resource model:
- `Source resource`: the complete target , i.e. an entire image that we want to select a section of.
- `SpecificResource`: the segment of the resource described by the `Specifier`
- `Specifiers`: describes how to determine the aspects of the `Source` that constitute the Specific Resource. 

### Specifiers

There are 3 types of specifiers:
- `oa:State`: specifies the state of a `Body` or a `Target` applicable to an `Annotation` in order to retrieve the proper representation of the resource. For example, 
    - the timestamp at which a `Body` was created (if there are several versions of the same resource with different timestamps)
- `oa:Selector`: specifies the segment of a resource relevant to the `Annotation`: text range, image section, SVG selector...
- `oa:Style`: a description of how to style an `Annotation`

If `State` and `Selector` are present in a annotation, the `State` will be processed before `Selector` to be sure that we have the proper state.

Keys:
- `a` (IIIF `@type`) `oa:SpecificResource`: the specific resource
- `oa:hasSource` (SAS `full`): the `Source Resource` being specified by the `Specific Resource`.
    - MUST be used: the `Specific Resource` is defined relatively to the `Source Resource`, and so the renderer will fetch the `Source` before targeting the `Specific resource` part.

I'll only present selectors, not `states` or `styles` that aren't used in IIIF.

### Selectors

A `Selector` is a `Specifier` which describes how to determine the segment of interest from within the retrieved representation of the Source resource. There MUST be only 1 `Selector` per specifier, otherwise use the [multiplicity module](https://web.archive.org/web/20221225112718/http://www.openannotation.org/spec/core/multiplicity.html).

- `oa:hasSource` (IIIF `full`): the `Source resource`
- `oa:hasSelector` (IIIF `selector`): the `Selector`'s content

There are selectors other than those presented below: `RangeSelector`, `TextPositionSelector`, `TextQuoteSelector`... but they are out of scope with IIIF so I won't talk about them

#### FragmentSelector

- `a` (IIIF `@type`): `oa:FragmentSelector`
- `rdf:value` (IIIF `value`): `string'
- `dcterms:conformsTo`: the specification that defines the syntax of the fragment.
    - for IIIF, targets can only be targeted using IIIF-specific `ImageApiSelector` or W3C media fragments (`xhwh=int,int,int,int`).
    - SHOULD be used
    - SHOULD be one of: 

<table>
<tbody><tr><th>Fragment Specification</th><th>Description</th></tr>
<tr><td>http://tools.ietf.org/rfc/rfc3236</td><td><a href="https://web.archive.org/web/20221225112722/http://tools.ietf.org/rfc/rfc3236">XHTML, and HTML</a>. Example: #namedSection </td></tr>
<tr><td>http://tools.ietf.org/rfc/rfc3778</td><td><a href="https://web.archive.org/web/20221225112722/http://tools.ietf.org/rfc/rfc3778">PDF</a>. Example: #page=10&amp;viewrect=50,50,640,480</td></tr>
<tr><td>http://tools.ietf.org/rfc/rfc5147</td><td><a href="https://web.archive.org/web/20221225112722/http://tools.ietf.org/rfc/rfc5147">Plain Text</a>. Example: #char=0,10</td></tr>
<tr><td>http://tools.ietf.org/rfc/rfc3023</td><td><a href="https://web.archive.org/web/20221225112722/http://tools.ietf.org/rfc/rfc3023">XML</a>. Example: #xpointer(/a/b/c) </td></tr>
<tr><td>http://www.ietf.org/rfc/rfc3870</td><td><a href="https://web.archive.org/web/20221225112722/http://www.ietf.org/rfc/rfc3870">RDF/XML</a>. Example: #namedResource </td></tr>
<tr><td>http://www.w3.org/TR/media-frags/</td><td><a href="https://web.archive.org/web/20221225112722/http://www.w3.org/TR/media-frags/">W3C Media Fragments</a>. Example: #xywh=50,50,640,480</td></tr>
<tr><td>http://www.w3.org/TR/SVG/</td><td><a href="https://web.archive.org/web/20221225112722/http://www.w3.org/TR/SVG/">SVG</a>. Example: #svgView(viewBox(50,50,640,480))</td></tr>
</tbody></table>

```js
{
    // ...
    selector: {
        "@type": "oa:FragmentSelector",
        "value": "xywh=int,int,int,int"  // so here we use the W3C media fragments selector
    }

}
```

#### SVG selectors

`SvgSelectors` define an area through an SVG.
- the `SvgSelector`'s value MUST be a valid and complete SVG document
- the SVG SHOULD be a single shape: `path|rect|circle|ellipse|polyline|polygone|g`
- dimensions in the SVG MUST be relative to the `Source resource`. 
    - For example, given an image which is 600 pixels by 400 pixels, and the desired section is a circle of 100 pixel radius at the center of the image, then the SVG element would be: `<circle cx="300" cy="200" r="100"/>`


### Examples


`Specific resource` structure in IIIF 2.x.
```js
{
    "@type" : "oa:SpecificResource",
    "within" : {
      "@id" : "https://aikon.enpc.fr/aikon/iiif/v2/wit9_man11_anno165/manifest.json",
      "@type" : "sc:Manifest"
    },
    "selector" : {
        "@type" : "oa:FragmentSelector",
        "value" : "xywh=0,31,1865,1670"
    },
    "full" : "https://aikon.enpc.fr/aikon/iiif/v2/wit9_man11_anno165/canvas/c16.json"
} 
```

`Specific resource` that uses the IIIF `ImageApiSelector` extension
```js
{
    // `@id` uses the IIIF Image api to describe the fragment
    "@id": "http://www.example.org/iiif/book1-page1/50,50,1250,1850/full/0/default.jpg",
    "@type": "oa:SpecificResource",
    
    // `full` describes the full image.
    "full": {
        "@id": "http://example.org/iiif/book1-page1/full/full/0/default.jpg",
        "@type": "dctypes:Image",
        "service": {
            "@context": "http://iiif.io/api/image/2/context.json",
            "@id": "http://example.org/iiif/book1-page1",
            "profile": "http://iiif.io/api/image/2/level2.json"
        }
    },
    
    // `selector` describes the region targeted in `@id`
    "selector": {
        "@context": "http://iiif.io/api/annex/openannotation/context.json",
        "@type": "iiif:ImageApiSelector",
        "region": "50,50,1250,1850"
    }
}
```

---

## Multiplicity

[https://web.archive.org/web/20221225112718/http://www.openannotation.org/spec/core/multiplicity.html](https://web.archive.org/web/20221225112718/http://www.openannotation.org/spec/core/multiplicity.html)

In IIIF, this module is useful if we want to specify more than 1 `SpecificResource`. In OA, the multiplicity module is used to have multiple bodies or targets in an annotation (IE: 3 bodies in 3 languages). Options for multiplicity are:

- `oa:Choice`: only one of several bodies/targets will be rendered at once. Done by defining 1 default value and other alternative values
- `oa:Composite`: when all resources are required for an annotation to function properly.
- `oa:List`: like a composite, but ordered

`Bodies` and `Targets` can use `multiplicity` by setting their `@type` to `oa:Choice | oa:Composite |oa:List`.

I have only ever seen `oa:Choice` be used in IIIF so that's the one I'll present.

### `oa:Choice`

```
{
    "@type": "oa:Choice",
    "default": /** default choice */,
    "item": /** one or several other available items */
}
```

Example: a choice between a `FragmentSelector` and an `SvgSelector`
```js
{
    "@type" : "oa:Choice",
    "default" : {
        "@type" : "oa:FragmentSelector",
        "value" : "xywh=0,31,1865,1670"
    },
    "item" : {
        "@type" : "oa:SvgSelector",
        "value" : "<svg xmlns=\"http://www.w3.org/2000/svg\"><path xmlns='http://www.w3.org/2000/svg' d='M0 31 h 932 v 0 h 932 v 835 v 835 h -932 h -932 v -835Z' id='rectangle_wit9_man11_anno165_c16_5ebd8bc8044b45b58aae2a508ca75eed' data-paper-data='{&quot;strokeWidth&quot;:1,&quot;rotation&quot;:0,&quot;annotation&quot;:null,&quot;nonHoverStrokeColor&quot;:[&quot;Color&quot;,0,1,0],&quot;editable&quot;:true,&quot;deleteIcon&quot;:null,&quot;rotationIcon&quot;:null,&quot;group&quot;:null}' fill-opacity='0' fill='#00ff00' fill-rule='nonzero' stroke='#00ff00' stroke-width='1' stroke-linecap='butt' stroke-linejoin='miter' stroke-miterlimit='10' stroke-dashoffset='0' style='mix-blend-mode: normal'/></svg>"
    }
}
```




