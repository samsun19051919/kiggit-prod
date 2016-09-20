#!/bin/bash
cd /www
npm install newrelic
NODE_ENV=test forever -w -l forever.log -o out.log -e err.log --minUptime 1000 --spinSleepTime 1000 ./bin/www
#NODE_ENV=test node ./bin/www
#./bin/www

