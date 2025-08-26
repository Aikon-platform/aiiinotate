# Open annotations data model

[https://web.archive.org/web/20220119101135/http://www.openannotation.org/spec/core](https://web.archive.org/web/20220119101135/http://www.openannotation.org/spec/core)
[https://www.w3.org/TR/annotation-vocab/](https://www.w3.org/TR/annotation-vocab/)


The IIIF 2.x standard relies on the W3C Open annotations (OA) standard. Established in 2013, it has since been deprecated in favour of the W3C's Web annotations model, described in the next section. To make things fun, the site is not longer available and must be accessed through the wayback machine.

---

## In general

- an Annotation is a set of interconnected resources, made mostly of a `Body` and a `Target`
- the data model is **implementation independant** and can be implemented in JSON, RDF-XML...

---

## Vocabulary

- `Annotation`: a set of interconnected resources, with at its core a `Body` and a `Target`, where the `Body` is about the `Target`.
- `Target`: the object being annotated
- `Body`: the annotation's contents

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
