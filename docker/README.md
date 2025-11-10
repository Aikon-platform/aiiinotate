# Docker usage

---

## Usage

Note that all `docker` commands must be run from the `docker/` directory !

1. Clone the repo and `cd` in it

```bash
git clone git@github.com:Aikon-platform/aiiinotate.git
cd aiiinotate
```

2. Create a `.env` file at `config/.env` (from the root of the project)

```bash
cp ./config/.env.template ./config/.env
vim ./config/.env  # do your edits
```

3. Build the containers

```bash
cd docker
bash docker.sh build
```

4. Start the containers

```bash
bash docker.sh start
```

---

## Troubleshooting and useful commands

Access `mongosh` within the Mongo container:

```bash
sudo docker exec -it docker-mongo-1 mongosh
```

Check running ports in the Web container:

```bash
sudo docker exec -it docker-web-1 ss -tnl
```
