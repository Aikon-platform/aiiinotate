#!/usr/bin/env bash

set -e;

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# basic / dev config
ENV_CONFIG="$SCRIPT_DIR/../config/.env"
# docker specific config, created by `env_to_docker`
ENV_DOCKER="$SCRIPT_DIR/.env"

get_os() {
    unameOut="$(uname -s)"
    case "${unameOut}" in
        Linux*)     os=Linux;;
        Darwin*)    os=Mac;;
        CYGWIN*)    os=Cygwin;;
        MINGW*)     os=MinGw;;
        MSYS_NT*)   os=Git;;
        *)          os="UNKNOWN:${unameOut}"
    esac
    echo "${os}"
}
OS=$(get_os)

# mac+linux compatible file replacements
sed_repl () {
    sed_expr="$1"
    file="$2"
    if [ "$OS" = "Linux" ];
    then sed -i -e "$sed_expr" "$file";
    else sed -i "" -e "$sed_expr" "$file";
    fi
}

# copy config/.env file to docker/.env and adapt the file to work with docker.
env_to_docker() {
    # check the env file is found
    if [ ! -f "$ENV_CONFIG" ];
    then
        echo ".env file not found at at '$ENV_CONFIG'. exiting...";
        return 1;  # will exit when used with `set -e`
    fi;

    # NOTE that the MongoDB host in Docker MUST BE the name of the Mongo docker service (defined in docker-compose)
    cp "$ENV_CONFIG" "$ENV_DOCKER";
    sed_repl s~^MONGODB_HOST=.*$~MONGODB_HOST=mongo~ "$ENV_DOCKER";
    sed_repl s~^AIIINOTATE_HOST=.*~AIIINOTATE_HOST=0.0.0.0~ "$ENV_DOCKER"
}
env_to_docker;

build_containers () {
    sudo docker compose --env-file "$ENV_DOCKER" build --no-cache;
}

start_containers() {
    sudo docker compose --env-file "$ENV_DOCKER" up --force-recreate;
}

stop_containers() {
    sudo docker compose --env-file "$ENV_DOCKER" down;
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

