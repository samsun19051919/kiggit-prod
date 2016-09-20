#!/bin/bash
#spark-1.5.2-bin-hadoop2.6/bin/spark-submit --verbose --packages datastax:spark-cassandra-connector:1.5.0-s_2.10 --master spark://10.0.0.10:7077 simpleCApp/target/scala-2.10/simple-project_2.10-1.0.jar 
#~/kiggit/kiggit-parser/spark/spark-1.5.2-bin-hadoop2.6/bin/spark-submit --packages datastax:spark-cassandra-connector:1.5.0-s_2.10 --master local ~/kiggit/kiggit-parser/spark/spark-payout/simpleCApp/target/scala-2.10/simple-project_2.10-1.0.jar 
~/kiggit/kiggit-parser/spark/spark-1.6.1-bin-hadoop2.6/bin/spark-submit --packages datastax:spark-cassandra-connector:1.6.0-s_2.10 --master local ~/kiggit/kiggit-parser/spark/spark-betslip-leaderboard/simpleCApp/target/scala-2.10/simple-project_2.10-1.0.jar $1 $2
