#!/bin/env bash

# use through package.json scripts.

# these sripts are used to manage all migrations in parallel
# on both the main database and the test database.
#NOTE migrate-init is not implemented.

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

source "$SCRIPT_DIR/utils.sh" || exit 1;

MIGRATIONS_DIR_MAIN="$MIGRATIONS_DIR/dbMain";
MIGRATIONS_DIR_TEST="$MIGRATIONS_DIR/dbTest";

MIGRATIONS_DIRS=("$MIGRATIONS_DIR_MAIN" "$MIGRATIONS_DIR_TEST");

##################################################
# functions

# create a migration
migrate_make() {
    migration_name="$1";

    if [ -z "$migration_name" ];
    then echo "ERROR. a migration name must be given."; exit 1;
    fi;

    echo ">>> $migration_name";
    dotenvx run -f "$ENV_FILE" -- npx migrate-mongo create "$migration_name";
}

# apply migrations
migrate_apply() {
    dotenvx run -f "$ENV_FILE" -- npx migrate-mongo up;
}

# rvert the last migration
migrate_revert() {
    dotenvx run -f "$ENV_FILE" -- npx migrate-mongo down;
}

# undo all migrations
migrate_revert_all() {
    for _ in "$MIGRATIONS_DIR"/migrationScripts/*;
    do dotenvx run -f "$ENV_FILE" -- npx migrate-mongo down;
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
then echo "ERROR: unrecognized keyword $OP. please use one of 'make', 'apply', 'revert', 'revertAll'. exiting..."; exit 1;
fi;

for dir_ in "${MIGRATIONS_DIRS[@]}"; do
    cd "$dir_";
    pwd;
    ls;
    $FUNC "$MIGRATION_NAME";
done

