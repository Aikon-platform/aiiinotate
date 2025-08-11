#!/bin/env bash

SCRIPTS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
source "$SCRIPTS_DIR/utils.sh";

if ! command -v npm &> /dev/null; then
    echo_title "INSTALL NVM & NODE";
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
    nvm install node
    npm install -g webpack webpack-cli
fi

echo_title "SETUP FASTIFY APP";
cd "$ROOT_DIR";
npm i;
