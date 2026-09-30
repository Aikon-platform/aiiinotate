#!/bin/env bash

set -e

# mongo install guide: https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/#std-label-install-mdb-community-ubuntu

#NOTE only the mongodb installation is done here. for database creation, see `setup_mongodb_populate.sh`

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
source "$SCRIPT_DIR/utils.sh"

# float arithmetic comparison is not supported by bash and we need to use `bc`
# usage: if float_comparison "a >= b"; then... ; fi
float_comparison () {
    expr="$1"
    (( $(echo "$expr" |bc -l) ));
}

install_mongodb_ubuntu () {

    # NOTE: the most recent mongodb version (8.0) has since may 2026 an
    # incompatibility with recent linux kernels => we clip mongo to v7.0.
    # since mongo 7.0 doesn´t have a release for ubuntu 24, we use the 
    # ubuntu 22 release (focal, see `DISTRIB` variable below)
    # see: https://jira.mongodb.org/browse/SERVER-121912
    MONGO_VERSION="7.0"

    color_echo purple "NOTE: installing Mongo 7 instead of the more recent Mongo 8 to avoid incompatibility with linux kernel (see: https://jira.mongodb.org/browse/SERVER-121912)"

    # assert we have an 86 64 architecture
    if [ "$(arch)" != "x86_64" ];
    then echo "MongoDB only supports x86_64 architectures (yours is $(arch)). exiting..."; exit 1
    fi;

    # fetch the release name. Mongo only supports LTS versions, so if the user's Ubuntu version is not LTS, we get the name of the last LTS released before the user's version.
    source "/etc/lsb-release"
    if float_comparison "$DISTRIB_RELEASE >= 24.04";
    then DISTRIB="jammy";  # noble not supported by mongo 7.0, use jammy instead
    elif float_comparison  "$DISTRIB_RELEASE >= 22.04";
    then DISTRIB="jammy";
    elif float_comparison "$DISTRIB_RELEASE >= 20.04";
    then DISTRIB="focal";
    else echo "Your Ubuntu version ($DISTRIB_RELEASE) is not supported by MongoDB ${MONGO_VERSION}"; exit 1;
    fi;

    sudo apt-get install -y gnupg curl

    curl -fsSL "https://www.mongodb.org/static/pgp/server-${MONGO_VERSION}.asc" | \
    sudo gpg -o "/usr/share/keyrings/mongodb-server-${MONGO_VERSION}.gpg" \
    --dearmor

    # create list file
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-${MONGO_VERSION}.gpg ] https://repo.mongodb.org/apt/ubuntu $DISTRIB/mongodb-org/${MONGO_VERSION} multiverse" | sudo tee "/etc/apt/sources.list.d/mongodb-org-${MONGO_VERSION}.list"   
    
    sudo apt-get update

    sudo apt-get install -y "mongodb-org=${MONGO_VERSION}.*"
}

install_mongodb_mac () {
    xcode-select --install;
    brew tap mongodb/brew;
    brew update;
    brew install mongodb-community@8.0;
}

if ! command -v mongod ; then
    echo_title "INSTALL MONGODB"

    if [ "$OS" = "Linux" ]; then
        install_mongodb_ubuntu;
        sudo systemctl start mongod;
    elif [ "$OS" = "Mac" ]; then
        install_mongodb_mac;
        brew services start mongodb-community@8.0;
    else echo "Unsupported OS: $OS"; exit 1;
    fi;
  else color_echo green "MongoDB is aldready installed on your machine :)"
fi;
