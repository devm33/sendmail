#!/usr/bin/env bash

# Script to just take node up and down, no need to be constantly restarting redis, compass, etc

# down
killall -SIGINT node

# up
node server.js &
