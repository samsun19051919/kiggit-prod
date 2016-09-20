#!/bin/bash
cd /www
npm install
NODE_ENV=test forever -w -l forever.log -o out.log -e err.log --minUptime 1000 --spinSleepTime 1000 ./websocket-worker.js
#./bin/www
#NODE_ENV=test node ./websocket-worker.js
