#!/usr/bin/env bash

# Script to stop the local build and serve process

killall -SIGINT node
killall -SIGINT compass
redis-cli shutdown

