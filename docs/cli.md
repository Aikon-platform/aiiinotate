# CLI DOCUMENTATION

The CLI is the main interface to interact with aiiinotate: all aiiinotate commands are started from the CLI.

---

## Basics

1. **Have your app set up**, either in dev or in prod. See [README](https://github.com/Aikon-platform/aiiinotate/blob/main/README.md) for more info

2. **In prod, source your `.env`**. See README.

3. **The base command is**:

```bash
# in prod
aiiinotate

# in dev
npm run cli
```

**The command changes with a prod install**, because the package has been installed with `npm`. 
- for the rest of this doc, we use `aiiinotate` instead of `npm run cli`. Use whichever is appropriate to your use case.
- `npm run cli` runs a bash script that also manages environment sourcing.
- when using `npm run cli`, you will sometimes need to add `--` to separate different arguments:
    ```bash
    npm run cli -- <command> <arguments>
    ```

## `serve`: start the app

```bash
# serve the app in dev mode
aiiinotate serve dev

# serve the app in prod mode
aiiinotate serve prod
```

---

## `migrate`: run database migrations

NOTE: **in dev**, run `npm run migrate`, which is a wrapper for `npm run cli migrate`.

```bash
# create a new migration
aiiinotate migrate make --migration-name <your migration name>
# the equivalent in dev is:
npm run migrate make -- --migration-name <your migration name>

# apply all pending migrations
aiiinotate migrate apply

# revert the last migration
aiiinotate migrate revert

# revert all migrations
aiiinotate migrate revert-all
```

---

## `import`: import data

```bash
# in prod
aiiinotate import -i 2 -f <path/to/import/file.txt>
```

Where:
- `-i` `--iiif-version` (`2|3`) is the IIIF Presentation API version of the data to import:
    - if `-i 3`, we import IIIF presentation 3.x annotations
    - if `-i 2`, we import IIIF presentation 2.x annotations
- `-f --file` is a relative or absolute path the the import file. This import file:
    - contains a list of paths to annotation lists or annotation pages
    - with 1 path per line
    - paths can be relative or absolute

NOTE that data to import **MUST MATCH the IIIF version**: if `-i 2`, you can only import `AnnotationLists` following the IIIF Presentation 2.x standard, and note annotations in 3.x format.

Here is an example of import file:

```
./annotations/wit91_pdf108_anno194.json
./annotations/wit70_man70_anno206.json
./annotations/wit71_man71_anno202.json
./annotations/wit68_man68_anno198.json
./annotations/wit72_man72_anno133.json
./annotations/wit75_man74_anno130.json
./annotations/wit2_man4_anno4.json
```
