# aiiinotate

aiiinotate is a fast and lightweight annotation server for IIIF. It relies on `nodejs/fastify` and `mongodb` and provides an API to read/write/update/delete IIIF annotations and index manifests.

---

## PROD USAGE

### Install 

TODO: install mongodb

```bash
npm install aiiinotate
```

### Usage

The base command is:

```bash
aiiinotate --env <path-to-your-env-file> -- <command>
```

It will give full access to the CLI interface of Aiiinotate.

####  Run the app 

0. Setup your `.env` file after [.env.template](./config/.env.template).

1. Start `mongod`

```bash
sudo systemctl start mongod
```

2. Create and configure the database

```bash
aiiinotate --env <path-to-your-env-file> -- migrate apply
```

3. Run

```bash
aiiinotate --env <path-to-your-env-file> -- serve prod
# or 
aiiinotate --env <path-to-your-env-file> -- serve dev
```

#### Import data

TODO

---

## DEV USAGE

### Install 

```bash
bash setup.sh
```

### Usage

#### First steps

0. Setup your `.env` file after [.env.template](./config/.env.template) and place it at `./config/.env`.

1. Start mongod

```bash
sudo systemctl start mongod
```

#### Run commands

- Start the app:

```bash
npm run start
```

- Test the app:

```bash
npm run test
```

- Run the CLI:

```bash
npm cli
```

- Process migrations:

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

GNU GPL 3.0.
