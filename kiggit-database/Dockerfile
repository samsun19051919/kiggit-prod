FROM ubuntu:14.04

RUN apt-get update && apt-get install -y git python build-essential curl nano wget libkrb5-dev
RUN wget https://nodejs.org/dist/v4.2.1/node-v4.2.1-linux-x64.tar.gz
RUN sudo tar -C /usr/local --strip-components 1 -xzf node*

#WORKDIR /www

CMD /www/start.sh
#EXPOSE 80:80
#EXPOSE 443:443
EXPOSE 9042:9042
