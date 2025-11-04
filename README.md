# aiiinotate

---

## RUN NPM LINK:

```bash
npm link
npx dotenvx run -f ./config/.env -- aiiinotate serve dev
```

TODO: find why we can't juste source the dotenv variables and need to pass by dotenvx.

---

aiiinotate is a fast and lightweight annotations server for IIIF. It relies on `nodejs/fastify` and `mongodb` and provides an API to read/write/update/delete IIIF annotations and index manifests.

---

## Prod install and usage

### Install 

TODO: install mongodb

```bash
aiiinotate
```

### Usage

The base command is:

```bash
aiiinotate
```

It will give full access to the CLI interface of Aiiinotate.

####  Run the app 

0. Setup your `.env` file after [.env.template](./config/.env.template).

1. Configure the database

```bash
aiiinotate migrate apply
```

2. Run

```bash
aiiinotate serve prod
# or 
aiiinotate serve dev
```

#### Import data

TODO

---

## Dev install and usage

### Install 
```bash
bash setup.sh
```

### Usage

1. Start the app:

```bash
npm start
```

2. Test the app:

```bash
npm test
```

3. Run the CLI:

```bash
npm cli
```

4. Process migrations:

```bash
# create a new migration. NOTE: the `--` is necessary !
npm run migrate make -- --migrate-name <your migration name>

# apply all pending migrations
npm run migrate apply

# revert the last migration
npm run migrate revert

# revert all migrations
npm run migrate revert-all)
```

---

## License

MIT License
