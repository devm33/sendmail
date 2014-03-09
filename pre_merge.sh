#!/usr/bin/env bash

# Script to be run before pushing or merging with other branches

# shutdown local testing processes
bash down_local.sh;

# remove debug and minify css files
compass compile -e production --force

# jshint the js files (complain if it is not available)
command -v jshint >/dev/null 2>&1 || { echo >&2 "Please install jshint: npm install -g jshint"; exit 1;}

jshint *.js lib/*.js static/*.js # note: avoid hinting all the node modules
