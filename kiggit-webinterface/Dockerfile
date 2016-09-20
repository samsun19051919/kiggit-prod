FROM ubuntu:14.04

RUN apt-get update && apt-get install -y git python build-essential curl nano wget libkrb5-dev
RUN wget https://nodejs.org/dist/v4.4.5/node-v4.4.5-linux-x64.tar.gz
RUN sudo tar -C /usr/local --strip-components 1 -xzf node*

RUN npm install express -g
RUN npm install express-generator -g
RUN npm install -g nodemon
RUN npm install -g forever
RUN npm install -g typescript gulp-cli

#WORKDIR /www

CMD /www/start.sh
EXPOSE 80:80
#EXPOSE 443:443
#EXPOSE 3000:3000
