#!/usr/bin/env bash

SCRIPT="$1";
ENV_PATH="$2";
shift 2;
EXTRA_ARGS=("$@");

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd );
ROOT_DIR=$(realpath "$SCRIPT_DIR"/..);
DOTENVX_BIN="$ROOT_DIR/node_modules/.bin/dotenvx";

# verify ENV_PATH and convert it to an absolute path if needed
if [[ ! -f "$ENV_PATH" ]];
then echo "Env path '$ENV_PATH' not found ! Exiting..." && exit 1;
fi;
if [[ ! "$ENV_PATH" = /* ]];
then ENV_PATH="$PWD"/"$ENV_PATH";
fi;

cd "$ROOT_DIR";  # necessary because node needs to access package.json
sudo systemctl start mongod;
case "$SCRIPT" in
    cli)
        "$DOTENVX_BIN" run -f "$ENV_PATH" -- node "$ROOT_DIR"/cli/index.js "${EXTRA_ARGS[@]}";
        ;;
    dev)
        nodemon --watch ./src --exec "bash -c '$DOTENVX_BIN run -f $ENV_PATH -- node $ROOT_DIR/cli/index.js serve dev'";
        ;;
    test)
        "$DOTENVX_BIN" run -f "$ENV_PATH" -- node --test --test-isolation=none --experimental-test-coverage
        ;;
    *)
        echo "Unknown run mode: $SCRIPT. Exiting...";
        exit 1;
        ;;
esac
