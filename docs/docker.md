# Docker usage

The `docker/` folder contains:
- a `Dockerfile` for aiiinotate
- a `docker-comose` to integrate aiiinotate with MongoDB, with volume persistance
- a script to import data into a dockerized aiiinotate instance

---

## Docker setup

1. [Install docker](https://docs.docker.com/engine/install/)
2. On linux, add your user to the `docker` group (see [full docs](https://docs.docker.com/engine/install/linux-postinstall/))

```bash
sudo groupadd docker
sudo usermod -aG docker $USER
newgrp docker
```

---

## Usage

Note that all `docker` commands must be run from the `docker/` directory!

1. Clone the repo and `cd` in it

```bash
git clone git@github.com:Aikon-platform/aiiinotate.git
cd aiiinotate/
```

2. Create a `.env` file at `docker/.env` (from the root of the project):
```bash
cp ./config/.env.template ./docker/.env
vim ./docker/.env  # do your edits
```

3. Edit the `.env` file. Pay attention to the following values:
- `MONGODB_HOST=mongo` (container name)
- `AIIINOTATE_HOST=aiiinotate` (container name)
- `AIIINOTATE_SCHEME=http`
- `AIIINOTATE_LOG_TARGET=stdout` (Docker aldready collects stdout logs, so setting log target to `file` is redundant)
- set `AIIINOTATE_PUBLIC_URL` to the URL at which your aiiinotate instance will be accessible (e.g., `aiiinotate.enpc.fr`).

4. Build the containers

```bash
cd docker
bash docker.sh build
```

5. Start the containers

```bash
bash docker.sh start
```

6. (Optional) import data into the running aiiinotate instance. `path/to/dir` is a path to a folder containing AnnotationLists or manifests to import.

```bash
bash docker_aiiinotate_import.sh <manifests|annotations> path/to/dir
```

---

## Troubleshooting and useful commands

View logs:

```bash
docker logs docker-aiiinotate-1 -f
```

Access `mongosh` within the Mongo container:

```bash
docker exec -it docker-mongo-1 mongosh
```

Check running ports in the Web container:

```bash
docker exec -it docker-web-1 ss -tnl
```

View globally installed NPM packages in the Web container:

```bash
docker exec -it docker-web-1 npm list -g --depth=0
```

CURL the Web container

```bash
docker exec -it docker-web-1 curl http://0.0.0.0:4444   # change 4444 by your $AIIINOTATE_PORT
```
