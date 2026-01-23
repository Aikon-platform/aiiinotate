# aiiinotate

aiiinotate is a fast and lightweight annotation server for IIIF. It relies on `nodejs/fastify` and `mongodb` and provides an API to read/write/update/delete IIIF annotations and index manifests.

---

## PROD USAGE

### Install 

1. **Install mongodb**.
    - see [dev installation script for help](./scripts/setup_mongodb.sh)
    - checkout the [official installation guide](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/#std-label-install-mdb-community-ubuntu)

2. **Install aiiinotate**
```bash
npm install aiiinotate
```

### Setup the app 

0. **Setup your `.env`** file after [.env.template](./config/.env.template).

1. **Start `mongod`**

```bash
sudo systemctl start mongod
```

2. **Create and configure the database**

```bash
aiiinotate --env <path-to-your-env-file> -- migrate apply
```

### Usage

All commands are accessible through a CLI (`./src/cli`).

#### Run the app 

```bash
aiiinotate --env <path-to-your-env-file> -- serve prod
# or 
aiiinotate --env <path-to-your-env-file> -- serve dev
```

#### Run administration commands

The base command is:

```bash
aiiinotate --env <path-to-your-env-file> -- <command>
```

It will give full access to the CLI interface of Aiiinotate. Run `aiiinotate --help` for more info.

1. Import data - TODO

---

## DEV USAGE

### Install 

```bash
# clone the repo
git clone git@github.com:Aikon-platform/aiiinotate.git

# move inside it
cd aiiinotate

# install mongodb
bash ./scripts/setup_mongodb.sh

# install node
bash ./scripts/setup_node.sh

# install dependencies
npm i
```

### Setup

After installing, some setup must be done

0. **Setup your `.env`** file after [.env.template](./config/.env.template) and place it at `./config/.env`.

1. **Start `mongod`**

```bash
sudo systemctl start mongod
```

2. **Configure the database**

```bash
npm run migrate apply
```

### Usage

Remember to have your `mongodb` service running: `sudo systemctl start mongod` !

- **Start the app**

```bash
# reload enabled
npm run dev

# reload disabled
npm run prod
```

- **Test the app**

```bash
npm run test
```

- **Run the CLI**

```bash
npm cli
```

- **Process migrations**

```bash
# create a new migration. NOTE: the `--` is necessary !
npm run migrate make -- --migration-name <your migration name>

# apply all pending migrations
npm run migrate apply

# revert the last migration
npm run migrate revert

# revert all migrations
npm run migrate revert-all
```

---

## License

GNU GPL 3.0.
