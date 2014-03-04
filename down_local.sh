#!/usr/bin/env bash

# Script to stop the local build and serve process

killall -s SIGINT node
killall -s SIGINT compass
redis-cli shutdown

