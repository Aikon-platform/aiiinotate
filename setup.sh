#!/bin/env bash

source "./scripts/utils.sh"

color_echo blue "\nInstalling prompt utility fzy..."
if [ "$OS" = "Linux" ]; then
    sudo apt install fzy
elif [ "$OS" = "Mac" ]; then
    brew install fzy
else
    color_echo red "Unsupported OS: $OS"
    exit 1
fi

run_script "setup_mongodb.sh" "MongoDB installation"
run_script "setup_node.sh" "Node and webapp packages installation"