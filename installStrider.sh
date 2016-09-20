#!/bin/bash
sudo apt-get  update
sudo apt-get  upgrade

#Install docker mercurial and unzip
sudo apt-get install apt-transport-https ca-certificates
sudo apt-key adv --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys 58118E89F3A912897C070ADBF76221572C52609D
sudo echo "deb https://apt.dockerproject.org/repo ubuntu-trusty main" >> /etc/apt/sources.list.d/docker.list
apt-cache policy docker-engine
sudo apt-get  update
sudo apt-get install mercurial
sudo apt-get install unzip docker-engine

##install jdk
sudo mkdir -p /usr/java/latest
wget --no-check-certificate --no-cookies --header "Cookie: oraclelicense=accept-securebackup-cookie" http://download.oracle.com/otn-pub/java/jdk/8u91-b14/jdk-8u91-linux-x64.tar.gz
tar -zxf jdk-8u91-linux-x64.tar.gz
sudo cp -rpf jdk1.8.0_91 /usr/java/latest
sudo update-alternatives --install "/usr/bin/java" "java" /usr/java/latest/jdk1.8.0_91/bin/java 1
rm -rf jdk1.8.0_91
rm jdk-8u91-linux-x64.tar.gz
sudo update-alternatives --set java /usr/java/latest/jdk1.8.0_91/bin/java

#pull nginx container
#docker pull combro2k/nginx-proxy-pagespeed:latest

#get hg repository
cd ~/
echo "[ui]
username=sebastian <sebastian@lapela.dk>
[auth]
bb.prefix = https://www.friaminds.dk/kiggit/kiggit
bb.username = seb
bb.password = Vinter2016" > ~/.hgrc
hg clone https://www.friaminds.dk/kiggit/kiggit

#create directories for xmlfiles
mkdir ~/kiggit/kiggit-parser/xmlfiles
mkdir ~/kiggit/kiggit-parser/xmlfiles/parsed
mkdir ~/kiggit/kiggit-parser/xmlfiles/notParsed

#install aws cli (being used to backup and restore xml files to amazon s3)
#curl "https://s3.amazonaws.com/aws-cli/awscli-bundle.zip" -o "awscli-bundle.zip"
#unzip awscli-bundle.zip
#sudo ./awscli-bundle/install -i /usr/local/aws -b /usr/local/bin/aws
#rm awscli-bundle.zip
#rm -rf awscli-bundle/
#mkdir ~/.aws
#cp ~/kiggit/awsConfig ~/.aws/config

chown -R ubuntu ~/kiggit

