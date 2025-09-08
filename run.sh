#!/bin/env bash

source "./scripts/utils.sh";

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
ENV_FILE="$SCRIPT_DIR/src/config/.env";

print_usage() {
    cat<<EOF

    USAGE bash run.sh [-d, -p, -t, -c, -h]

    (use from the scripts defined in 'package.json': 'npm start')

    -t: test the app
    -d: run the app in dev mode
    -p: run the app in prod mode
    -c: run the command line interface
    -h: print help and exit

EOF
}

start () {
    local mode="$1"

    if [ ! -f "$ENV_FILE" ];
    then echo -e "\nERROR: .env file not found at '$ENV_FILE'. exiting..." && exit 1;
    fi;

    start_mongod

    if [ "$mode" = "dev" ]; then
        dotenvx run -f "$ENV_FILE" -- \
        node --watch "$SCRIPT_DIR/src/server.js";
    elif [ "$mode" = "test" ]; then
        dotenvx run -f "$ENV_FILE" -- \
        node --test;
    elif [ "$mode" = "cli" ] ; then
        dotenvx run -f "$ENV_FILE" -- \
        node "$SCRIPT_DIR/cli/index.js";
    else echo -e "\nERROR: mode not implemented: '$mode'\n"; print_usage; exit 1;
    fi;
}

while getopts 'hdptc' mode_flag; do
    case "${mode_flag}" in
        d) MODE="dev"
            break;;
        p) MODE="prod"
            break;;
        t) MODE="test"
            break;;
        c) MODE="cli"
            break;;
        h) print_usage
           exit 0;;
        *) print_usage
           exit 1;;
    esac
done

start "$MODE";

