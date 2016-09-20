#!/bin/bash
#docker stop nginx
#docker rm nginx
#docker run --name nginx -d -p 80:80 -p 443:443 -p 4000:4000 -v /var/run/docker.sock:/tmp/docker.sock -it combro2k/nginx-proxy-pagespeed
#wait for nginx to start.
#sleep 15
echo ""
echo "Select which applications to run on this instance?"
echo "After each selection hit enter and then select Done"
echo "When running test you probably always want a local"
echo "Cassandra in addition to the server you are running"
echo ""
cassandra=0
kiggitServer=0
kiggitParser=0
kiggitWebinterface=0
Done=1
while [ $Done == 1 ]; do
    select app in "Cassandra" "kiggitServer" "kiggitParser" "kiggitWebinterface" "Done"; do
        case $app in
            Cassandra )         cassandra=1; break;;
            kiggitServer )   kiggitServer=1; break;;
            kiggitParser )   kiggitParser=1; break;;
            kiggitWebinterface )   kiggitWebinterface=1; break;;
	    Done )                   Done=0; break;;
        esac
    done
done
if [ $kiggitServer == 1 ]; then
    echo "kiggitServer will be started "
fi
if [ $cassandra == 1 ]; then
    echo "cassandra will be started"

fi
if [ $kiggitParser == 1 ]; then
    echo "kiggitParser will be stared"

fi
if [ $kiggitWebinterface == 1 ]; then
    echo "kiggitWebinterface will be stared"
fi

if [ $cassandra == 1 ]; then
echo "Starting cassandra"
~/kiggit/kiggit-database/runSystem.sh -d
fi
echo "The cassandra container should now be running in the background"

echo "sleeping 5"
sleep 13
if [ $kiggitServer == 1 ]; then
    ~/kiggit/kiggit-server/runSystem.sh -d
fi

sleep 3

if [ $kiggitWebinterface == 1 ]; then
    ~/kiggit/kiggit-webinterface/runSystem.sh -d
fi

if [ $kiggitParser == 1 ]; then
    ~/kiggit/kiggit-parser/runSystem.sh -d;
fi


