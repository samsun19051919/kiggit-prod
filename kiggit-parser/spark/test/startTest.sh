#!/bin/bash
cd /www/spark-payout/simpleCApp
sbt package
cd /www/spark-betslip-leaderboard/simpleCApp
sbt package

cd /www/test
npm install	
#bash
NODE_ENV=test mocha --harmony 
#NODE_ENV=test nodemon test/mytest.js
#./bin/www
