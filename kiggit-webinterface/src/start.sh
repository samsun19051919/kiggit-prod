#!/bin/bash
cd /www
#npm install --save bcrypt
#npm install --save-dev gulp gulp-typescript
NODE_ENV=test /www/bin/www
#NODE_ENV=test forever -w -l forever.log -o out.log -e err.log --minUptime 1000 --spinSleepTime 1000 ./bin/www
#forever -w /www/bin/www
