#!/bin/env bash

if ! systemctl is-active --quiet mongod;
then sudo systemctl start mongod;
fi;

npm run start;
