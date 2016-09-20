How to run the parser
=====================
It is expected that the kiggit folder is at /home/<username>/kiggit or ~/kiggit

Use the `runSystem.sh` script to start the parser. This requier Docker to be installed. The script starts op a node.js container. The node container bind to
cassandra with the name "cassandraDB" (Binding is an easy way to connect two containers so in our node container we only need two write "cassandraDB"
when specifying address and port of the cassandra container).

All src code for the node.js application is stored in the folder **node** which is mounted inside the node.js container. As well is the folder **xmlfiles** which holds data received from the feed. In this way the source code can be edited directly in the node folder and changes will take emidiatly effect. An other advanges for keeping our code and files outside containers is that containers can be deleted and all code and files will persist. The Cassandra container also store all its data in the folder **cassandra**. The script support running together with a special nginx container that autmaticaly handle virtual hosts. This is done by using the option -n. When the -n option is set the environment variable VIRTUAL_HOST=push.kiggit.com will be set on the node container. This tell nginx to forward request with destination for push.kiggit.com to the node.js container.
To start the nginx server issue the following command.

`docker run --name nginx -d -p 80:80 -p 443:443 -v /var/run/docker.sock:/tmp/docker.sock -it combro2k/nginx-proxy-pagespeed`

This will start an nginx container that listen on the hosts port 80 and 443 and then forward requests to containers started with the environment variale VIRTUAL_HOST.
    
`docker run -e VIRTUAL_HOST=\"push.kiggit.com\" -it <docker image>`

will start a docker container and nginx will forward all request to push.kiggit.com to the container"

**Usage**
---------
runSystem.sh <option>

where option is:  
*   -d   Demonize the containers. 
*   -h   Print help message
*   -n   Use nginx (read below)

If the -n option is **not** used the node container will listen on port 80 of the host.
If both the -d and -n option is **not** set the two containers will **not** be demonized and it will be posible to see the output in two terminal windows.
