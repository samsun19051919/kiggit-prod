#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
#rm -rf database/node_modules
sudo docker stop migration
sudo docker rm migration
if [[ "$(docker images -q seeeb/kiggit-nodejs)" == "" ]]; then
   echo "the image does not exisst so lets build it"
   cd ~/kiggit/kiggit-database
   sudo docker build -t seeeb/kiggit-nodejs .
fi
DATABASE=$DIR"/database"
sudo docker run --rm --name migration --link cassandra:cassandraDB -v $DATABASE:/www -it seeeb/kiggit-nodejs bash
