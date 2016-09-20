/* betslipLeaderboard.scala */

import com.datastax.spark.connector._
import org.apache.spark.SparkContext
import org.apache.spark.SparkContext._
import org.apache.spark.SparkConf
import com.datastax.spark.connector.cql.CassandraConnector

object betslipLeaderboard {
  def main(args: Array[String]) {
    val conf = new SparkConf(true)
      .set("spark.cassandra.connection.host", args(0))
      .setAppName("betslipLeaderboard")
    val sc = new SparkContext(conf)
    val keyspace = args(1)

    def updateLeaderboard(betslip: String) {
      try {
        println("--------------------------------2------------------------------------------------------")
        val participantsList = sc.cassandraTable(keyspace, "betslip_participants")
          .where("betslip_id = ?", betslip)
          .select("user_id")
          .map { row => row.getString("user_id") }
          .collect
          .toList

        val matcheswithresult = sc.cassandraTable(keyspace, "betslip_has_matches")
          .select("match_id")
          .where("betslip_id = ?", betslip)
          .joinWithCassandraTable(keyspace, "results")
          .select("match_id", "result", "goals_home", "goals_away")
          .map { case (row1, row2) => (row2.getInt("match_id"), (row2.getString("result"), row2.getString("goals_home") + "-" + row2.getString("goals_away")))}

        val matchList = matcheswithresult
          .map { case (m, _) => m }
          .collect
          .toList

        val userScore = sc.cassandraTable(keyspace, "match_has_user_predictions")
          .where("match_id IN ? AND user_id IN ? AND betslip_id = ?", matchList, participantsList, betslip)
          .select("match_id", "user_id", "prediction", "type")
          .map { row => (row.getInt("match_id"), (row.getString("user_id"), row.getString("prediction"), row.getInt("type"))) }
          .join(matcheswithresult)
          .map { case (m, ((u, p, t), (result, outcome))) => (u, if (t == 1 && p == result || t == 2 && p == outcome) {1} else {0})}
          .reduceByKey(_ + _)
          .map { case (u, s) => (betslip, u, s)}
        println("--------------------------------------------------------------------------------------")
        userScore.foreach(println)
        userScore.saveToCassandra(keyspace, "betslip_leaderboard", SomeColumns("betslip_id", "user_id", "user_score"))
        /*
        userScore.foreach( user_id =>
            CassandraConnector(conf).withSessionDo({ session =>
                val ps = session.prepare(s"UPDATE kiggit_test.user_funfacts SET betslipCounter = betslipCounter + 1 WHERE user_id = ?")
                val bound = ps.bind(java.util.UUID.fromString(user_id))
                session.execute(bound)
            })
        );*/
      } catch {
        case e: Exception => println("betslip:" + betslip + " could not resolve" + e)
      }
    }
    def forAllBetslips(match_id: String) {
      println("------------------------------------1--------------------------------------------------")
      try{
        sc.cassandraTable(keyspace, "match_in_betslips")
        .where("match_id = ?", match_id)
        .select("betslip_id")
        .map {row => row.getString("betslip_id")}
        .collect
        .foreach(updateLeaderboard)
      } catch {
        case e: Exception => println("match_id:" + match_id + " could not update leaderboards " + e)
      }
    }
    forAllBetslips(args(2))
  }
}