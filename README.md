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

### Env definition

#### Basic definition

Copy [`config/.env.template`](./config/.env.template) to `.env` and edit it.

#### Runtime env sourcing

Once the package is installed, it must access variables from the .env file. However, running `aiiinotate <commands>` creates a subscript which means **you can't `source` an `.env` file**.

```bash
# THIS WILL FAIL: `aiiinotate` is executed in a subscript that doesn't inherit from the variables fetched in `source`.
source /path/to/.env && aiiinotate <command>
```

#### The solutions: do either:
1. use `dotenvx` to inject variables:
    ```bash
    npx dotenvx run -f /path/to/.env -- aiiinotate <command>
    ```
2. manually export variables:
    ```bash
    set -a
    source /path/to/.env
    set +a
    aiiinotate <command>
    ```

For clarity, we omit env sourcing from the below commands.

### Setup the app

1. **Start `mongod`**

```bash
sudo systemctl start mongod
```

2. **Create and configure the database**

```bash
aiiinotate migrate apply
```

### Usage

All commands are accessible through a CLI (`./src/cli`).

#### Run the app

```bash
aiiinotate serve prod
```

#### Run the CLI

The base command is:

```bash
aiiinotate -- <command>
```

It will give full access to the CLI interface of Aiiinotate. Run `aiiinotate --help` for more info.

For more information (including **importing data**), see [the CLI docs](https://github.com/Aikon-platform/aiiinotate/blob/main/docs/cli.md).

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

1. **Setup your `.env`** file after [`config/.env.template`](./config/.env.template) and place it at `./config/.env`.

2. **Start `mongod`**

```bash
sudo systemctl start mongod
```

3. **Configure the database**

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

- **Test the app**. NOTE: the tests will probably fail if you set the env variable `AIIINOTATE_STRICT_MODE` to `true`.

```bash
npm run test
```

- **Run the CLI**. (see [the CLI docs](https://github.com/Aikon-platform/aiiinotate/blob/dev/docs/cli.md) for more info)


```bash
npm cli
```

- **Process migrations** (see [the CLI docs](https://github.com/Aikon-platform/aiiinotate/blob/dev/docs/cli.md) for more info)

```bash
# NOTE: the `--` is necessary !
npm run migrate -- <command> <arguments?>
```

---

## License

GNU GPL 3.0.
