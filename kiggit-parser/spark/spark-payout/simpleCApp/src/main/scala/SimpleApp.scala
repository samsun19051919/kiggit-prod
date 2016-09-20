/* SimpleApp.scala */

import com.datastax.spark.connector._
import org.apache.spark.SparkContext
import org.apache.spark.SparkContext._
import org.apache.spark.SparkConf
import com.datastax.spark.connector.cql.CassandraConnector

object SimpleApp {
  def main(args: Array[String]) {
    val conf = new SparkConf(true)
      .set("spark.cassandra.connection.host", args(0))
      .setAppName("SimpleApp")
    val sc = new SparkContext(conf)
    val keyspace = args(1)
    val kiggitPercent = 0.05
    val kiggitUserId = "11111111-1111-1111-1111-111111111111"
    def resolve(betslip: String) {
      try {
        println("1 betslip: " + betslip)
        val participantsList = sc.cassandraTable(keyspace, "betslip_participants")
          .where("betslip_id = ?", betslip)
          .select("user_id")
          .map { row => row.getString("user_id") }
          .collect
          .toList
        /**
         * increment all participants betslip count in user_funfact table
         */
        participantsList.foreach( user_id =>
            CassandraConnector(conf).withSessionDo({ session =>
                val ps = session.prepare(s"UPDATE kiggit_test.user_funfacts SET betslipCounter = betslipCounter + 1 WHERE user_id = ?")
                val bound = ps.bind(java.util.UUID.fromString(user_id))
                session.execute(bound)
            })
        );

        val matcheswithresult = sc.cassandraTable(keyspace, "betslip_has_matches")
          .select("match_id")
          .where("betslip_id = ?", betslip)
          .joinWithCassandraTable(keyspace, "results")
          .select("match_id", "result", "goals_home", "goals_away")
          .map { case (row1, row2) => (row2.getInt("match_id"), (row2.getString("result"), row2.getString("goals_home") + "-" + row2.getString("goals_away")))}

        println("2 matches with result " + matcheswithresult.count)
        matcheswithresult.foreach(println)
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
          
        println("3 userScore")
        userScore.foreach(println)
        
        val maxScore = userScore.collect.maxBy(_._2)
        println("4 maxScore is " + maxScore)

        val winners = userScore
          .filter { case (u, s) => if (s == maxScore._2) true else false };
        println("5 -- winners")
        winners.collect.foreach(println)
      
        
        //get transactions for each user (used double checking that user has not already been payd for the current betslip)
        val usersTransactions = sc.cassandraTable(keyspace, "user_transactions_on_betslips")
          .where("user_id IN ? AND betslip_id = ? AND amount > ?", participantsList, betslip, 0)
          .select("user_id")
          .map { row => row.getString("user_id") }
          .collect
          .toList

        //get payout size (winners / potsize)
        val potsize = sc.cassandraTable(keyspace, "potsize_counter")
          .select("counter_value")
          .where("betslip_id = ?", betslip)
          .first
          .getInt("counter_value")

        val kiggitFee = (potsize * kiggitPercent).longValue()
        val payout1 = ((potsize - kiggitFee)  / winners.count())
        val payout = ((potsize - kiggitFee)  / winners.count()).longValue()
        println(payout)
        
        //for each winner update their money_counter add transaction to the users transaction table and add winners to the winner table
        var payoutCount = 0;
        var resolved = false;
        winners.collect().foreach({ case (u, _) =>
          if (usersTransactions.contains(u))
            println("error payment for this betslip has already been payd" + u)
          else {
            var moneyCounterUpdated = true;
            //1. update users money_counter
            try {
              CassandraConnector(conf).withSessionDo({ session =>
                val ps = session.prepare(s"UPDATE kiggit_test.money_counter SET counter_value = counter_value + ? WHERE user_id = ?")
                val bound = ps.bind(payout: java.lang.Long, java.util.UUID.fromString(u))
                session.execute(bound)
              });
            } catch {
              case e: Exception => moneyCounterUpdated = false;
            }
            //2. only if 1 above seceded do the following
            if (moneyCounterUpdated) {
              try {
                //3 insert transaction in users transaction table
                CassandraConnector(conf).withSessionDo({ session =>
//                  val ps = session.prepare(s"BEGIN BATCH" + 
//                                            "INSERT INTO kiggit_test.user_transactions_on_betslips (user_id, betslip_id, amount) VALUES(?, ?, ?);" +
//                                            "INSERT INTO kiggit_test.winners (betslip_id, user_id, amount, position) VALUES (?, ?, ?, ?);" + 
//                                            "APPLY BATCH" );
//                val bound = ps.bind(java.util.UUID.fromString(u), java.util.UUID.fromString(betslip), payout.toInt: java.lang.Integer, java.util.UUID.fromString(betslip), java.util.UUID.fromString(u), payout.toInt: java.lang.Integer, payout.toInt: java.lang.Integer)
                  val ps = session.prepare(s"INSERT INTO kiggit_test.user_transactions_on_betslips (user_id, betslip_id, amount) VALUES(?, ?, ?)")
                  val bound = ps.bind(java.util.UUID.fromString(u), java.util.UUID.fromString(betslip), payout.toInt: java.lang.Integer)
                  session.execute(bound)
                });
                CassandraConnector(conf).withSessionDo({ session =>
                  val ps = session.prepare(s"INSERT INTO kiggit_test.winners (betslip_id, user_id, amount, position) VALUES (?, ?, ?, ?)")
                  val bound = ps.bind(java.util.UUID.fromString(betslip), java.util.UUID.fromString(u), payout.toInt: java.lang.Integer, 1: java.lang.Integer)
                  session.execute(bound)
                });
                payoutCount = payoutCount + 1;
              } catch {
                case e: Exception => println(e)
                  //4 if 3 above failed role back users money counter which was updated in 1.
                  CassandraConnector(conf).withSessionDo({ session =>
                    val ps = session.prepare(s"UPDATE kiggit_test.money_counter SET counter_value = counter_value - ? WHERE user_id = ?")
                    val bound = ps.bind(payout: java.lang.Long, java.util.UUID.fromString(u))
                    session.execute(bound)
                  });
                  payoutCount = payoutCount - 1;
              }
            }
          }
        })

        if (winners.count() == payoutCount){
          if (usersTransactions.contains(kiggitUserId))
            println("error payment to kiggit has already been payd.")
          else {  
            var moneyCounterUpdated = true;
            //1. update users money_counter
            try {
              CassandraConnector(conf).withSessionDo({ session =>
                val ps = session.prepare(s"UPDATE kiggit_test.money_counter SET counter_value = counter_value + ? WHERE user_id = ?")
                val bound = ps.bind(kiggitFee: java.lang.Long, java.util.UUID.fromString(kiggitUserId))
                session.execute(bound)
              });
            } catch {
              case e: Exception => moneyCounterUpdated = false;
            }
            //2. only if 1 above seceded do the following
            if (moneyCounterUpdated) {
              try {
                //3 insert transaction in users transaction table
                CassandraConnector(conf).withSessionDo({ session =>
                  val ps = session.prepare(s"INSERT INTO kiggit_test.user_transactions_on_betslips (user_id, betslip_id, amount) VALUES(?, ?, ?)")
                  val bound = ps.bind(java.util.UUID.fromString(kiggitUserId), java.util.UUID.fromString(betslip), kiggitFee.toInt: java.lang.Integer)
                  session.execute(bound)
                  resolved = true;
                });
              } catch {
                case e: Exception => println(e)
                  //4 if 3 above failed role back users money counter which was updated in 1.
                  CassandraConnector(conf).withSessionDo({ session =>
                    val ps = session.prepare(s"UPDATE kiggit_test.money_counter SET counter_value = counter_value - ? WHERE user_id = ?")
                    val bound = ps.bind(kiggitFee: java.lang.Long, java.util.UUID.fromString(kiggitUserId))
                    session.execute(bound)
                  });
                  payoutCount = payoutCount - 1;
              }
            }
          }
        }
        //if all winners good paid set betslip to resolved
        if (resolved) {
          println(s"6 payoutCount is $payoutCount winners.count is " + winners.count())
          CassandraConnector(conf).withSessionDo({ session =>
            val ps = session.prepare(s"INSERT INTO kiggit_test.betslip (betslip_id, status) VALUES(?, ?)")
            val bound = ps.bind(java.util.UUID.fromString(betslip), "resolved": String)
            session.execute(bound)
          })
        }
      } catch {
        case e: Exception => println("betslip:" + betslip + " could not resolve" + e)
      }
    }


/*
 *resolves all settled betslips
 */
  val betslips = sc.cassandraTable(keyspace, "betslip")
    .where("status = ?", "settled")
    .select("betslip_id")
    .map(row => row.getString("betslip_id"))
    .collect
    .foreach(resolve)
  }

}