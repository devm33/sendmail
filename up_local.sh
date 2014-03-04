#!/usr/bin/env bash

# Script to start the local build and serve process

redis-server ./config/redis.conf &

node server.js &

compass watch &


