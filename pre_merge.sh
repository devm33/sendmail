#!/usr/bin/env bash

# Script to be run before pushing or merging with other branches

bash down_local.sh;

compass compile -e production --force

