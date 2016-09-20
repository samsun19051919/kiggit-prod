#!/bin/bash
# Start op a cassandra container. The cassandra folder is mounted in the Cassandra container where cassandra store 
# persistant files. In this way data will be stored even if the container  container is deleted
usage="$(basename "$0") <option> -- Script to start cassandra

where option is:  
   -d  Demonize the container
   -n  Use nginx (read below)

If the -n option is not used the node container will listen on port 80 of the host.
If both the -d and -n option is not set the two containers will not be demonized and it will be posible to see the output in two terminal windows. 

The -n option requier a speciel nginx container. When the -n option is set the environment variable VIRTUAL_HOST=push.kiggit.com will be set on the node container. This tell nginx to forward request with destination for push.kiggit.com to the node.js container.
To start the nginx server issue the following command.

    docker run --name nginx -d -p 80:80 -p 443:443 -v /var/run/docker.sock:/tmp/docker.sock -it combro2k/nginx-proxy-pagespeed

This will start an nginx container that listen on the hosts port 80 and 443 and then forward requests to containers started with the environment variale VIRTUAL_HOST.

    docker run -e VIRTUAL_HOST=\"feed.kiggit.com\" -it <docker image>

will start a docker container and nginx will forward all request to push.kiggit.com to the container"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CASSANDRA=$DIR"/cassandra"
SCHEMA=$DIR"/schema"
demonize="0"
nginx="0"
virtualHostNginx=""
while [ "$1" != "" ]; do
    case $1 in
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
sudo docker stop cassandra
sudo docker rm cassandra
if [ "$demonize" == "0" -a "$nginx" == "0" ]; then
echo "Not demonizing and not running with NGINX"
    sudo docker run --name cassandra -v $SCHEMA:/schema -v $CASSANDRA:/var/lib/cassandra -p 7199:7199 -p 9042:9042 -p 9160:9160 -it cassandra:3.3

fi
if [ "$demonize" == "1" -a "$nginx" == "0" ]; then
echo "Demonize"
    sudo docker run --name cassandra -v $SCHEMA:/schema -v $CASSANDRA:/var/lib/cassandra -p 7199:7199 -p 9042:9042 -p 9160:9160 -d cassandra:3.3
fi
if [ "$demonize" == "0" -a "$nginx" == "1" ]; then
echo "Use Nginx"
    sudo	docker run --name cassandra -v $SCHEMA:/schema -v $CASSANDRA:/var/lib/cassandra -d -it  cassandra:3.3
fi
if [ "$demonize" == "1" -a "$nginx" == "1" ]; then
echo "Demonize and use Nginx"
    sudo	docker run --name cassandra -v $SCHEMA:/schema -v $CASSANDRA:/var/lib/cassandra -d cassandra:3.3
fi

