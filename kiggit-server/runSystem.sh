#!/bin/bash
# starts a node container. Inside the node container the dir server
# is mountet. In this way data will be stored even if a container is deleted
# Editing the source which lives in the server folder will take emidiatly effect as nodemon is used together with forever.

usage="$(basename "$0") <option> -- Script to start the parser and cassandra in two seperate containers

where option is:  
   -d  Demonize the containers. 
   -n  Use nginx (read below)

If the -n option is not used the node container will listen on port 80 of the host.
If both the -d and -n option is not set the two containers will not be demonized and it will be posible to see the output in two terminal windows. 

The -n option requier a speciel nginx container. When the -n option is set the environment variable VIRTUAL_HOST=wsdiscover.kiggit.com will be set on the node container. This tell nginx to forward request with destination for wsdiscover.kiggit.com to the node.js container.
To start the nginx server issue the following command.

    docker run --name nginx -d -p 80:80 -p 443:443 -v /var/run/docker.sock:/tmp/docker.sock -it combro2k/nginx-proxy-pagespeed

This will start an nginx container that listen on the hosts port 80 and 443 and then forward requests to containers started with the environment variale VIRTUAL_HOST.
    
    docker run -e VIRTUAL_HOST=\"wsdiscover.kiggit.com\" -it <docker image>

will start a docker container and nginx will forward all request to wsdiscower.kiggit.com to the container"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SERVER="/server"
SERVER=$DIR$SERVER
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
sudo docker stop kiggit-server
sudo docker rm kiggit-server
#sudo rm -rf $SERVER/node_modules
if [[ "$(sudo docker images -q seeeb/kiggit-server)" == "" ]]; then
echo "the image does not exisst so lets build it"
  sudo docker build -t seeeb/kiggit-server .
fi
if [ "$demonize" == "0" -a "$nginx" == "0" ]; then
echo ""
  sudo  docker run --name kiggit-server --link cassandra:cassandraDB -p 4000:4000 -it -v $SERVER:/www seeeb/kiggit-server
fi
if [ "$demonize" == "1" -a "$nginx" == "0" ]; then
echo "Demonize"
  sudo docker run --name kiggit-server --link cassandra:cassandraDB -p 4000:4000 -it -d -v $SERVER:/www seeeb/kiggit-server
fi
if [ "$demonize" == "0" -a "$nginx" == "1" ]; then
echo "Use Nginx"
  sudo docker run --name kiggit-server --link cassandra:cassandraDB -e VIRTUAL_HOST="wsdiscower.kiggit.com" -it -v $SERVER:/www seeeb/kiggit-server
fi
if [ "$demonize" == "1" -a "$nginx" == "1" ]; then
echo "Demonize and use Nginx"
  sudo	docker run --name kiggit-server --link cassandra:cassandraDB -e VIRTUAL_HOST="wsdiscower.kiggit.com" -it -d -v $SERVER:/www seeeb/kiggit-server
fi
