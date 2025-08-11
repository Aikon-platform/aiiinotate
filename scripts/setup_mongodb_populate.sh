#!/bin/env bash

#NOTE : this setup creates and populates our db WITHOUT users or authentication.
# it is possible to add users and auth to a mongodb instance, but
#   - it is a bit convoluted in itself
#   - it is difficult to automate: we would need to
#       - create a root user + a user for the app
#       - create this app user by generating mongosh scripts from the user's .env files (so use Python to write custom JS)
#       - update the mongodb conf file so that the systemd mongodb service uses auth login, which would need to parse YAML, so to use python

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
MONGODB_FILE="$SCRIPT_DIR/mongodb_populate.js";  # script file to populate the database
MONGODB_FILE_TEMPLATE="$MONGODB_FILE.template";

if [ ! -f "$MONGODB_FILE_TEMPLATE" ];
then echo "Database creation template '$MONGODB_FILE_TEMPLATE' not found. exiting..."; exit 1;
fi;

source "$SCRIPT_DIR/utils.sh";
source "$ENV_FILE";

echo_title "SETUP MONGODB DATABASE";

# transform $MONGODB_FILE_TEMPLATE into $MONGODB_FILE based on the contents of the .env file
#NOTE : further replacements will need to be done with `sed_repl_inplace` to avoid ovrwriting the contents each time !
connstring="mongodb://$MONGODB_HOST:$MONGODB_PORT"
sed_repl_newfile "s~CONNEXION_STRING~$connstring~g" "$MONGODB_FILE_TEMPLATE" "$MONGODB_FILE"

# run migration
mongosh -f "$MONGODB_FILE"
