#!/usr/bin/env bash

set -e;

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# docker specific config
ENV_DOCKER="$SCRIPT_DIR/.env"

if [ ! -f "$ENV_DOCKER" ];
then echo ".env file not found at '$ENV_DOCKER'. exiting..."; exit 1
fi

build_containers () {
    docker compose  build;
}

start_containers() {
    docker compose up -d;
}

stop_containers() {
    docker compose down;
}

case "$1" in
    start)
        start_containers
        ;;
    stop)
        stop_containers
        ;;
    build)
        stop_containers
        build_containers
        start_containers
        ;;
    *)
        echo "Usage: $0 {build|start|stop}"
        exit 1
        ;;
esac;

