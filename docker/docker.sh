#!/usr/bin/env bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

ENV_CONFIG="$SCRIPT_DIR/../config/.env"
ENV_DOCKER="$SCRIPT_DIR/.env"

if [ ! -f "$ENV_CONFIG" ];
then echo ".env file not found at at '$ENV_CONFIG'. exiting..." && exit 1;
fi;

# env file used for docker.
# NOTE that the MongoDB host in Docker MUST BE the name of the Mongo docker service (defined in docker-compose)
cp "$ENV_CONFIG" "$ENV_DOCKER";
sed -i -e s/^MONGODB_HOST=.*$/MONGODB_HOST="mongo"/ "$ENV_DOCKER";
git

# build the docker compose.
# if you provide -r, force to recreate the docker images.
while getopts "r" opt; do
    case "$opt" in
        r) sudo docker compose --env-file ./.env up --force-recreate;
            ;;
        # doesn't work but whatever
        *) sudo docker compose --env-file ./.env up;
            ;;
    esac;
done
