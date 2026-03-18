#!/usr/bin/env bash

SCRIPT="$1";
ENV_PATH="$2";
shift 2;
EXTRA_ARGS=("$@");

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd );
ROOT_DIR=$(realpath "$SCRIPT_DIR"/..);
DOTENVX_BIN="$ROOT_DIR/node_modules/.bin/dotenvx";

# if ENV_PATH is a relative path, convert it to an absolute path.
if [[ ! "$ENV_PATH" = /* ]];
then ENV_PATH="$PWD"/"$ENV_PATH";
fi;

cd "$ROOT_DIR";  # necessary because node needs to access package.json
sudo systemctl start mongod;
export AIIINOTATE_TARGET;

case "$SCRIPT" in
    cli)
        AIIINOTATE_TARGET="cli";
        "$DOTENVX_BIN" run -f "$ENV_PATH" -- node "$ROOT_DIR"/cli/index.js "${EXTRA_ARGS[@]}";
        ;;
    dev)
        AIIINOTATE_TARGET="dev";
        nodemon --watch ./src --exec "bash -c '$DOTENVX_BIN run -f $ENV_PATH -- node $ROOT_DIR/cli/index.js serve dev'";
        ;;
    prod)
        AIIINOTATE_TARGET="prod";
        run_cli serve prod;
        ;;
    test)
        AIIINOTATE_TARGET="test";
        "$DOTENVX_BIN" run -f "$ENV_PATH" -- node --test --test-isolation=none
        ;;
    *)
        echo "Unknown run mode: $SCRIPT. Exiting...";
        exit 1;
        ;;
esac

#    "cli": "[ -z \"$AIIINOTATE_TARGET\" ] && export AIIINOTATE_TARGET=cli; sudo systemctl start mongod && dotenvx run -f ./config/.env -- node ./cli/index.js",
#    "dev": "sudo systemctl start mongod && nodemon --watch ./src --exec \"npm run cli serve dev\"",
#    "prod": "export AIIINOTATE_TARGET=prod; sudo systemctl start mongod && node ./cli/index.js serve prod",
#    "test": "export AIIINOTATE_TARGET=test; sudo systemctl start mongod && dotenvx run -f ./config/.env -- node --test --test-isolation=none",
