# aiiinotate

aiiinotate is a fast and lightweight annotations server for IIIF. It relies on `nodejs/fastify` and `mongodb` and provides an API to read/write/update/delete IIIF annotations and index manifests.

---

## Install

```bash
bash setup.sh
```

--- 

## Usage

Start the app in dev:

```bash
npm start
```

Start the app in prod:

```bash
npm prod
```

Test the app:

```bash
npm test
```

Run the CLI:

```bash
npm cli
```

Process migrations:

```bash
# create a new migration. NOTE: the `--` is necessary !
npm run migrate-make -- --migrate-name <your migration name>

# apply all pending migrations
npm run migrate-apply

# revert the last migration
npm run migrate-revert

# revert all migrations
npm run migrate-revert-all)
```

---

## License

MIT License
