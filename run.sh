#!/bin/env bash

source "./scripts/utils.sh";

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
ENV_FILE="$SCRIPT_DIR/src/config/.env";

print_usage() {
    cat<<EOF

    USAGE bash run.sh [-t, -d, -h]

    (use through the scripts defined in 'package.json')

    -t: test the app
    -d: run the app in dev mode
    -h: print help and exit

EOF
}

start () {
    local mode="$1"  # dev/test

    if [ ! -f "$ENV_FILE" ];
    then echo -e "\nERROR: .env file not found at '$ENV_FILE'. exiting..." && exit 1;
    fi;

    if ! systemctl is-active --quiet mongod;
    then sudo systemctl start mongod;
    fi;

    if [ "$mode" = "dev" ]; then
        dotenvx run -f "$ENV_FILE" -- \
        node --watch "$SCRIPT_DIR/src/server.js";
    elif [ "$mode" = "test" ]; then
        dotenvx run -f "$ENV_FILE" -- \
        node --test;
    else echo -e "\nERROR: mode not implemented: '$mode'\n"; print_usage; exit 1;
    fi;
}

while getopts 'hdpt' mode_flag; do
    case "${mode_flag}" in
        d) MODE="dev";;
        p) MODE="prod";;
        t) MODE="test";;
        h) print_usage
           exit 0;;
        *) print_usage
           exit 1;;
    esac
done

start "$MODE";

