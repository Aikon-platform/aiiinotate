#!/bin/env bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

source "$SCRIPT_DIR/scripts/utils.sh";

if ! systemctl is-active --quiet mongod;
then sudo systemctl start mongod;
fi;

npm run start -- #--env-file="$ENV_FILE";
