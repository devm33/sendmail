#!/usr/bin/env bash

# Script to start the local build and serve process

# first stop any existing ones
killall -s SIGINT node
killall -s SIGINT compass

node server.js &

compass watch &


