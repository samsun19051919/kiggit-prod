FROM ubuntu:14.04

RUN apt-get update && apt-get install -y git python build-essential curl nano wget libkrb5-dev
RUN wget https://nodejs.org/dist/v5.6.0/node-v5.6.0-linux-x64.tar.gz
RUN sudo tar -C /usr/local --strip-components 1 -xzf node*

RUN npm install express -g
RUN npm install -g nodemon
RUN npm install -g forever
#WORKDIR /www

CMD /www/start.sh
EXPOSE 80:80
EXPOSE 4000:4000
#EXPOSE 443:443
#EXPOSE 3000:3000
