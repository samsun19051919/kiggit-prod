#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
XMLFILES="/home/ubuntu/kiggit/kiggit-parser/xmlfiles"
~/kiggit/kiggit-database/runSystem.sh -d
sleep 15
sudo docker stop sparkTest
sudo docker rm sparkTest
if [[ "$(sudo docker images -q seeeb/kiggit-spark-test)" == "" ]]; then
echo "the image does not exisst so lets build it"
  sudo docker build -t seeeb/kiggit-spark-test -f DockerfileTest .
fi

sudo docker run --name sparkTest --link cassandra:cassandraDB -it -e SPARK_HOME=/www/spark-1.6.1-bin-hadoop2.6 -v $XMLFILES:/xmlfiles -v $DIR:/www seeeb/kiggit-spark-test
