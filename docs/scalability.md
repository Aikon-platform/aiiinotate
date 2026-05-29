
# Scalability

## Results

In [benchmarks](https://github.com/paulhectork/aiiinotate-benchmark), aiiinotate response times are between 1/100th and 1/10th of a second with up to 10,000,000 annotations. 

![benchmark results](./docs/includes/report_benchmark_aiiinotate_2026-05-28-02:50:48_7steps.png)

## Discussion

### Write times

Write times (`Write anno. list`, `Write anno.`) presented above are in all probability lower than in real world applications.

Indeed, a big bottleneck when inserting annotations is to fetch an annotation's target manifest through HTTP, in ordrer to fill the `canvasIdx` field.

When running the benchmark, all annotation URIs are on `https://localhost`, an URI on localhost that is inaccessible. The request thus fails instantly.

The reason this was done is that HTTP requests are non-deterministic: if we make requests to an external server storing IIIF manifests, then we end up also benchmarking this server. This is why this step was removed from the benchmark.

###  >10M annotations

After benchmarking for 10M annotations, we delete the database and attempt to insert 100M annotations to benchmark response times.

With 100M annotations stored, the database size becomes an issue. These scalability limits are mostly caused by MongoDB, and not by the aiiinotate app itself: the larger the database, the more hard drive memory it uses, and the more RAM it uses (since indexes are stored in the RAM). To store >100M annotations, we should scale hardware:

- **vertical scaling**: more RAM and disk space
- **horizontal scaling**: use a Mongo [sharded cluster](https://www.mongodb.com/docs/manual/sharding/).

It should be noted that the benchmark stress tests your machine, aiiinotate and Mongo at the same time. 
- results presented above are obtained by running the benchmark, aiiinotate and Mongo on a single machine. All 3 are thus competing for RAM access and CPU.
- it uses mutliple threads, fast I/O and has a high throughput: it runs a lot of queries to aiiinotate, and to the MongoDB. 

In real-world examples, with less throughput and when not running the benchmark itself, there should be less stress on your MongoDB server, thus less CPU usage, thus possibly more scalability.
