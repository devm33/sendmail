#!/usr/bin/env bash

# Script to be run before pushing or merging with other branches

# shutdown local testing processes
bash down_local.sh;

# remove debug and minify css files
compass compile -e production --force

# jshint the js files (complain if it is not available)
command -v jshint >/dev/null 2>&1 || { echo >&2 "Please install jshint: npm install -g jshint"; exit 1;}

JSFILES="*.js lib/*.js static/*.js"
EXCLUDE=$(sed 's/\([\.\/()]\)/\\\1/g' <<< "static/ejs.min.js ") # escape special chars from paths #TODO replaces spaces with \|
JSFILES=$(echo $JSFILES | sed "s/\($EXCLUDE\)//g")

if grep -q 'console\\.log' $JSFILES
then
    echo "Warning: console\\.log found in js"
    grep 'console.log' $JSFILES
fi

jshint $JSFILES # note: avoid hinting all the node modules
