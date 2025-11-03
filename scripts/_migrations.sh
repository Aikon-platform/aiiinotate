#!/bin/env bash

# use through package.json scripts.

# these sripts are used to manage all migrations in parallel
# on both the main database and the test database.
#NOTE migrate-init is not implemented.

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

source "$SCRIPT_DIR/utils.sh" || exit 1;

MIGRATIONS_CONFIG_MAIN="$MIGRATIONS_DIR/migrate-mongo-config-main.js";
MIGRATIONS_CONFIG_TEST="$MIGRATIONS_DIR/migrate-mongo-config-test.js";
MIGRATIONS_CONFIGS=("$MIGRATIONS_CONFIG_MAIN" "$MIGRATIONS_CONFIG_TEST");

##################################################
# functions

# create a migration
# NOTE `migrate-mongo create` generates a timestamped file and, since this script is run twice
# (once per config file), 2 migration files are created. so what we do is mimic migrate-make by
# copying a blank template file to the `migrationScripts` directory.
migrate_make() {
    config_fp=$1;  # path to config file
    migration_name="$2";  # name of migration to create

    if [ -z "$migration_name" ];
    then echo "ERROR. a migration name must be given."; exit 1;
    fi;

    cp "$MIGRATIONS_DIR/migrationTemplate.js" "$MIGRATIONS_DIR/migrationScripts/$(date +'%Y%m%d%H%M%S')-$migration_name.js";
}

# apply migrations
migrate_apply() {
    config_fp=$1;  # path to config file
    dotenvx run -f "$ENV_FILE" -- npx migrate-mongo up -f "$config_fp";
}

# rvert the last migration
migrate_revert() {
    config_fp=$1;  # path to config file
    dotenvx run -f "$ENV_FILE" -- npx migrate-mongo down -f "$config_fp";
}

# undo all migrations
migrate_revert_all() {
    config_fp=$1;  # path to config file

    for _ in "$MIGRATIONS_DIR"/migrationScripts/*;
    do dotenvx run -f "$ENV_FILE" -- npx migrate-mongo down -f "$config_fp";
    done;
}


##################################################
# cli

OP=$1
MIGRATION_NAME=$2  # only used by `migrate_make`

case "$OP" in
    make) FUNC=migrate_make;;
    apply) FUNC=migrate_apply;;
    revert) FUNC=migrate_revert;;
    revertAll) FUNC=migrate_revert_all;;
esac;

if [ -z "$FUNC" ];
then echo "ERROR: unrecognized keyword '$OP'. please use one of 'make', 'apply', 'revert', 'revertAll'. exiting..."; exit 1;
fi;

start_mongod

for config_fp in "${MIGRATIONS_CONFIGS[@]}"; do
    $FUNC "$config_fp" "$MIGRATION_NAME";
done

