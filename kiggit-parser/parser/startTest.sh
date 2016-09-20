#!/bin/bash
cd /www
npm install	
NODE_ENV=test mocha --harmony
#NODE_ENV=test nodemon test/mytest.js
#./bin/www
