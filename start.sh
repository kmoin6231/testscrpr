#!/bin/bash
# This script is designed to be run by Render

# Print debugging information
echo "==== Starting Server ===="
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "HOST: $HOST"
echo "PWD: $(pwd)"
echo "========================="

# Make sure the port is numeric
if [[ ! "$PORT" =~ ^[0-9]+$ ]]; then
  echo "PORT is not a number, defaulting to 10000"
  export PORT=10000
fi

# Ensure HOST is set
if [ -z "$HOST" ]; then
  echo "HOST not set, defaulting to 0.0.0.0"
  export HOST=0.0.0.0
fi

# Start the server
node backend/server.js
