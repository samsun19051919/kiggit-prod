#!/bin/bash
cd ~/kiggit/kiggit-parser/spark
wget http://mirrors.rackhosting.com/apache/spark/spark-1.6.1/spark-1.6.1-bin-hadoop2.6.tgz
tar zxvf spark-1.6.1-bin-hadoop2.6.tgz

#echo "export SPARK_HOME=\"~/kiggit/kiggit-parser/spark/spark-1.6.1-bin-hadoop2.6\"" >> ~/.bashrc
#source ~/.bashrc
#source ~/.bashrc
#source ~/.bashrc
#source ~/.bashrc
#source ~/.bashrc

#echo "deb https://dl.bintray.com/sbt/debian /" | sudo tee -a /etc/apt/sources.list.d/sbt.list
#sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 642AC823
#sudo apt-get update
#sudo apt-get install sbt

#cd /home/ubuntu/kiggit/kiggit-spark/spark-payout/
#sbt package
#sudo chmod 755 ~/kiggit/kiggit-spark/spark-payout/runPayout.sh
#write out current crontab
#crontab -l > newCron
#echo new cron into cron file
#echo "*/1 * * * * ~/kiggit/kiggit-spark/spark-payout/runPayout.sh >> ~/kiggit/kiggit-spark/payout.log" >> newCron
#install new cron file
#crontab newCron
#rm newCron
