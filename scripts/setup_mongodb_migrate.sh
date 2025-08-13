#!/bin/env bash

#NOTE : this setup creates and populates our db WITHOUT users or authentication.
# it is possible to add users and auth to a mongodb instance, but
#   - it is a bit convoluted in itself
#   - it is difficult to automate: we would need to
#       - create a root user + a user for the app
#       - create this app user by generating mongosh scripts from the user's .env files (so use Python to write custom JS)
#       - update the mongodb conf file so that the systemd mongodb service uses auth login, which would need to parse YAML, so to use python

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
ROOT_DIR="$SCRIPT_DIR/../"

cd "$ROOT_DIR"

npm run migrate-apply

