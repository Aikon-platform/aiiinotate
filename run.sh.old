#!/bin/env bash

source "./scripts/utils.sh";

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

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

    if ! systemctl is-active --quiet mongod;
    then sudo systemctl start mongod;
    fi;

    if [ "$mode" = "dev" ]; then node "$SCRIPT_DIR/src/server.js";
    elif [ "$mode" = "test" ]; then node "$SCRIPT_DIR/src/test.js";
    else echo -e "\nERROR: unrecognized mode: '$mode'\n"; print_usage; exit 1;
    fi;
}

while getopts 'hdt' mode_flag; do
    case "${mode_flag}" in 
        d) MODE="dev";;
        t) MODE="test";;
        h) print_usage
           exit 0;;
        *) print_usage
           exit 1;;
    esac
done

start "$MODE";

