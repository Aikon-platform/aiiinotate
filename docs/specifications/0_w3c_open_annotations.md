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

### Annotations

An annotation has 1+ `Targets` and 0+ `Bodies`
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
- IIIF `@id`: `URI`
    - is used to identify with an URI the `Annotation`, `Body` and `Target`
    - in Turtle, there is no specific key because the standard is different.

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
 
## SpecificResources

Specific
