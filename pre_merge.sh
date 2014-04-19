#!/usr/bin/env bash

# Script to be run before pushing or merging with other branches

# shutdown local testing processes
bash down_local.sh;

# remove debug and minify css files
compass compile -e production --force

# jshint the js files (complain if it is not available)
command -v jshint >/dev/null 2>&1 || { echo >&2 "Please install jshint: npm install -g jshint"; exit 1;}

JSFILES="*.js lib/*.js static/*.js"
# escape special chars from paths
EXCLUDE="static/ejs.min.js static/lodash.custom.min.js static/jquery-ui-1.10.4.custom.min.js static/jquery.datetimepicker.js"
EXCLUDE=$(sed 's/\([\.\/()]\)/\\\1/g' <<< "$EXCLUDE") # remove special chars for regex
EXCLUDE=$(sed 's/\s/\\\|/g' <<< "$EXCLUDE") # replace whitespace with | ors for regex
JSFILES=$(echo $JSFILES | sed "s/\($EXCLUDE\)//g") # remove excluded files from search group with regex

if grep -q 'console\\.log' $JSFILES
then
    echo "Warning: console\\.log found in js"
    grep 'console.log' $JSFILES
fi

jshint $JSFILES # note: avoid hinting all the node modules
