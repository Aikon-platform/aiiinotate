# DATABASE AND MIGRATIONS

---

## Collections

- `annotations2`: a collection of annotations following the IIIF Presentation API 2.x (OpenAnnotation specification)
- `annotations3`: a collection of annotations following the IIIF Presentation API 3.x (WebAnnotation specification)
- `manifests2`: an index of manifests (manifest ID and array of canvas IDs of the manifest) following the IIIF Presentation API 2.x (OpenAnnotation specification)
- `manifests3`: an index of manifests (manifest ID and array of canvas IDs of the manifest) following the IIIF Presentation API 3.x (WebAnnotation specification)

Conversion between IIIF Presentation APIs 2 and 3 is not implemented.

---

## Validation rules

Two levels of validation rules are implemented:
- route-level validation
- database-level validation

At route-level, we ensure that the data has the absolutely necessary data to work with annotations.

At database-level (see [`src/schema`](https://github.com/Aikon-platform/aiiinotate/blob/main/src/schemas/) module, we define a complete model (in JSONSchema) to describe annotations.

**TLDR**: when inserting annotations (i.e., from an AnnotationList)
1. at [route-level](https://github.com/Aikon-platform/aiiinotate/blob/main/src/data/annotations/routes.js), we ensure that the AnnotationList is generally valid (contains a `resource` with annotations, each annotations contains a `on`...)
2. in the [`Annotations2`](https://github.com/Aikon-platform/aiiinotate/blob/main/src/data/annotations/annotations2.js) module, we do some extra checks and extra minimal reformatting to ensure that our annotations all have the same structure (i.e., convert `annotation.on` values to an array of `SpecificResources`). After finishing the cleanup, we are certain that an annotation can be inserted
3. when inserting an annotation in the MongDB `annotations2`, MongoDB uses the `annotation` schema defined in [`src/schemas/schemasPresentation2`](https://github.com/Aikon-platform/aiiinotate/blob/main/src/schemas/schemasPresentation2.js) to validate annotations before inserting.

---

## Migrations

Migrations are used to specify changes to the database's structure (creation and deletion of collections and indexes, changes to collection options such as validation rules etc.). Migration is done using [`migrate-mongo`](https://github.com/seppevs/migrate-mongo), a command-line interface for npm.

*Note that here, migrations only concern changes to the structure, not changes to the data.*

Where things get a bit complicated is that, while in use, our app uses a single database, in **dev mode, our app uses 2 databses**:
- a `main` database (default database that will be put in production)
- a `test` database (empty database to run tests, add dummy data to and so on).

For consistency, `test` must mirror the structure of `main`: same collections, indexes, validation rules etc. So, we must manage our migrations so that **all changes to the structure of `main` are reflected in the structure of `test`**. This is not possible natively through `migrate-mongo`. Managing both databases in parrallel manually would risk a lot of inconsistencies.


Our solution is to automate the management of both databases in parrallel:
- there are **2 migration config files**, one for each database
- both migration config files point to **the same migration scripts folder**, so that both database can apply the same migrations
- execute all migrations by **wrapping `migrate-mongo` in a homemade script**: [`scripts/migrations.sh`](../scripts/migrations.sh).

```
root/
  |__migrations/
       |__migrationScripts              // folder containing all migration scripts. consumed by both migration config files.
       |__baseConfig.js                 // base config file that both config files are derived from
       |__migrate-mongo-config-main.js  // config file for the main db
       |__migrate-mongo-config-test.js  // config file for the test db
```
