#!/usr/bin/env bash

# Script to stop the local build and serve process

killall node
killall compass
redis-cli shutdown

