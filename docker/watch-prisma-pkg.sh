#!/usr/bin/env bash

# Watch for dist/generated/prisma directory and ensure package.json exists
while true; do
  if [ -d /usr/src/app/dist/generated/prisma ]; then
    if [ ! -f /usr/src/app/dist/generated/package.json ]; then
      echo '{"type": "module"}' > /usr/src/app/dist/generated/package.json
      echo "Created dist/generated/package.json for ESM support"
    fi
  fi
  sleep 2
done
