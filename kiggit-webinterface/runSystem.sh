#!/bin/bash
# uncomment all lines below to make a fresh build of the system

sudo docker stop kiggit-webinterface
sudo docker rm kiggit-webinterface

DIR="$(cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LOGFILES="/../kiggit-server/server"
LOGFILES=$DIR$LOGFILES

cd ~/kiggit/kiggit-webinterface
demonize="0"
nginx="0"

#rm -rf kiggit-webinterface/node_modules
#sudo docker build -t seeeb/kiggit-webinterface .

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

if [ "$demonize" == "0" -a "$nginx" == "0" ]; then
echo "Not demonizing and not running with NGINX"
  sudo docker run -it --name kiggit-webinterface --link kiggit-server:kiggit-server --link cassandra:cassandraDB -p 2222:80 -v $LOGFILES:/logfiles -v ~/kiggit/kiggit-webinterface/src:/www seeeb/kiggit-webinterface
fi
if [ "$demonize" == "1" -a "$nginx" == "0" ]; then
echo "Demonize"
  sudo docker run -d --name kiggit-webinterface --link kiggit-server:kiggit-server --link cassandra:cassandraDB -p 2222:80 -v $LOGFILES:/logfiles -v ~/kiggit/kiggit-webinterface/src:/www seeeb/kiggit-webinterface
fi

