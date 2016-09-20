INSTALL SPARK
=============

Run install.sh not as root. ( don't do "sudo ./install.sh" but do "./install.sh")
Then manualy run the following command as it is not proberly executed in the shell script.

source /home/ubuntu/.bashrc

1. instalation
The install script download the nessesary software, compile the source code of the payout application and add the payoutjob to cron.
Settings of how often the script should be run can be eddited by åbening the cronjobs with the command <crontab -e>

2 As it is now there are no configuration file. To change cassandra host and keyspace
 edit the parameters in the top of the file spark-payout/src/main/scala/simpleApp.scala
  and then cd into the spark-payout directory and run <sbt package>

To change if the spark job should be send to an external master edit the cmd option for spark-submit. This require a spark cluster to
running. See spark-payout/runPayout.sh

