name := "Simple Project"

version := "1.0"

scalaVersion := "2.10.5"

resolvers += "Spark Packages Repo" at "https://dl.bintray.com/spark-packages/maven"
libraryDependencies += "org.scalacheck" %% "scalacheck" % "1.13.0" % "test"
libraryDependencies += "datastax" % "spark-cassandra-connector" % "1.6.0-s_2.10"
libraryDependencies += "org.apache.spark" %% "spark-sql" % "1.6.1"





