FROM ubuntu:14.04

RUN apt-get update && apt-get install -y git python build-essential curl nano wget libkrb5-dev
RUN wget https://nodejs.org/dist/v4.2.1/node-v4.2.1-linux-x64.tar.gz
RUN sudo tar -C /usr/local --strip-components 1 -xzf node*

##install jdk
RUN sudo mkdir -p /usr/java/latest
RUN wget --no-check-certificate --no-cookies --header "Cookie: oraclelicense=accept-securebackup-cookie" http://download.oracle.com/otn-pub/java/jdk/8u91-b14/jdk-8u91-linux-x64.tar.gz
RUN tar -zxf jdk-8u91-linux-x64.tar.gz
RUN sudo cp -rpf jdk1.8.0_91 /usr/java/latest
RUN sudo update-alternatives --install "/usr/bin/java" "java" /usr/java/latest/jdk1.8.0_91/bin/java 1
RUN rm -rf jdk1.8.0_91
RUN rm jdk-8u91-linux-x64.tar.gz
RUN sudo update-alternatives --set java /usr/java/latest/jdk1.8.0_91/bin/java

ENV SPARK_HOME ~/kiggit/kiggit-parser/spark/spark-1.6.1-bin-hadoop2.6
#RUN echo "export SPARK_HOME=\"~/kiggit/kiggit-parser/spark/spark-1.6.1-bin-hadoop2.6\"" >> ~/.bashrc
#RUN source ~/.bashrc
#RUN echo "deb https://dl.bintray.com/sbt/debian /" | sudo tee -a /etc/apt/sources.list.d/sbt.list
#RUN sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 642AC823
#RUN sudo apt-get update
#RUN sudo apt-get install sbt

RUN npm install express -g
RUN npm install -g nodemon
RUN npm install -g forever

#WORKDIR /www

CMD /www/start.sh
EXPOSE 80:80
#EXPOSE 443:443
#EXPOSE 3000:3000
