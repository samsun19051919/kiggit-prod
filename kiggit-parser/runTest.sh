#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PARSER="/parser"
PARSER=$DIR$PARSER
XMLFILES=$DIR"/xmlfiles"
sudo docker stop parserTest
sudo docker rm parserTest
if [[ "$(sudo docker images -q seeeb/kiggit-parser-test)" == "" ]]; then
echo "the image does not exisst so lets build it"
 sudo   docker build -t seeeb/kiggit-parser-test -f DockerfileTest .
fi
sudo docker run --name parserTest --link cassandra:cassandraDB -it -v $XMLFILES:/xmlfiles -v $PARSER:/www seeeb/kiggit-parser-test
