#!/bin/bash
# Start op a cassandra container and a node container. Inside the node container the dir nodeParser
# is mountet. And the cassandra folder is mounted in the Cassandra container where cassandra store 
# persistant files. In this way data will be stored even if a container is deleted
# Editing the source which lives in the nodeParser folder will take emidiatly effect as nodemon is used.
usage="$(basename "$0") <option> -- Script to start the parser and cassandra in two seperate containers

where option is:  
   -d  Demonize the containers. 
   -n  Use nginx (read below)

If the -n option is not used the node container will listen on port 80 of the host.
If both the -d and -n option is not set the two containers will not be demonized and it will be posible to see the output in two terminal windows. 

The -n option requier a speciel nginx container. When the -n option is set the environment variable VIRTUAL_HOST=push.kiggit.com will be set on the node container. This tell nginx to forward request with destination for push.kiggit.com to the node.js container.
To start the nginx server issue the following command.

    docker run --name nginx -d -p 80:80 -p 443:443 -v /var/run/docker.sock:/tmp/docker.sock -it combro2k/nginx-proxy-pagespeed

This will start an nginx container that listen on the hosts port 80 and 443 and then forward requests to containers started with the environment variale VIRTUAL_HOST.
    
    docker run -e VIRTUAL_HOST=\"feed.kiggit.com\" -it <docker image>

will start a docker container and nginx will forward all request to push.kiggit.com to the container"

DIR="$(cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SPARK="/spark"
SPARK=$DIR$SPARK
PARSER="/parser"
PARSER=$DIR$PARSER
CASSANDRA=$DIR"/cassandra"
XMLFILES=$DIR"/xmlfiles"
demonize="0"
nginx="0"
testproduction="0"
virtualHostNginx=""

while [ "$1" != "" ]; do
    case $1 in
        -testproduction )       testproduction="1"
                   ;;
        -d )       demonize="1"
                   ;;
        -n )       nginx="1"
                   ;;
        -h )       echo "$usage"
                   exit 1
                  ;;
    esac
    shift
done
sudo docker stop kiggit-parser
sudo docker rm kiggit-parser
if [[ "$(sudo docker images -q seeeb/kiggit-parser)" == "" ]]; then
echo "the image does not exisst so lets build it"
sudo    docker build -t seeeb/kiggit-parser .
fi
if [ "$demonize" == "0" -a "$nginx" == "0" -a "$testproduction" == "0" ]; then
echo "Not demonizing and not running with NGINX"
sudo    docker run --name kiggit-parser --link cassandra:cassandraDB -p 80:80 -it -v $XMLFILES:/xmlfiles -v $SPARK:/root/kiggit/kiggit-parser/spark -v $PARSER:/www seeeb/kiggit-parser
fi
if [ "$demonize" == "0" -a "$nginx" == "0" -a "$testproduction" == "1" ]; then
echo "Not demonizing and not running with NGINX"
sudo    docker run --name kiggit-parser -p 80:80 -it -v $XMLFILES:/xmlfiles -v $SPARK:/root/kiggit/kiggit-parser/spark -v $PARSER:/www seeeb/kiggit-parser
fi
if [ "$demonize" == "1" -a "$nginx" == "0" ]; then
echo "Demonize"
sudo    docker run --name kiggit-parser --link cassandra:cassandraDB -p 80:80 -it -d -v $XMLFILES:/xmlfiles -v $SPARK:/root/kiggit/kiggit-parser/spark -v $PARSER:/www seeeb/kiggit-parser
fi
if [ "$demonize" == "0" -a "$nginx" == "1" ]; then
echo "Use Nginx"
sudo    	docker run --name kiggit-parser --link cassandra:cassandraDB -e VIRTUAL_HOST="feed.kiggit.com" -it -v $XMLFILES:/xmlfiles -v $SPARK:/root/kiggit/kiggit-parser/spark -v $PARSER:/www seeeb/kiggit-parser
fi
if [ "$demonize" == "1" -a "$nginx" == "1" ]; then
echo "Demonize and use Nginx"
sudo   	docker run --name kiggit-parser --link cassandra:cassandraDB -e VIRTUAL_HOST="feed.kiggit.com" -it -d -v $XMLFILES:/xmlfiles -v $SPARK:/root/kiggit/kiggit-parser/spark -v $PARSER:/www seeeb/kiggit-parser
fi
