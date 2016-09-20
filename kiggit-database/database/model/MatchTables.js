/*
 Contains matches with a future scheduled start time. Started or previously
 played matches are automatically pruned by inserting with appropriate TTLs.

 * scheduled_startDay is a timestamp of just the day at midnight, while
 * scheduled_start is the full start date and time.
 * setting is the league name e.g. Premier League
 *
 The secondary index on match_id is only to be used by the parser on updates.
 */
var query = "CREATE TABLE upcoming_matches (" +
    "scheduled_start_day timestamp," +
    "match_id int," +
    "scheduled_start timestamp," +
    "country text," +
    "name text," +
    "tournament_name text," +
    "tournament_id int," +
    "home text," +
    "away text," +
    "PRIMARY KEY (scheduled_start_day, match_id)" +
    ") WITH " +
    "COMPACTION = { 'class': 'LeveledCompactionStrategy' } AND " +
    "GC_GRACE_SECONDS = 864000";

var query1 = "CREATE TABLE match_in_betslips (" +
    "match_id int," +
    "betslip_id uuid," +
    "PRIMARY KEY (match_id, betslip_id) " +
    ") WITH COMPACTION = { 'class': 'LeveledCompactionStrategy' } AND " +
    "GC_GRACE_SECONDS = 864000";

var query2 = "CREATE TABLE match (" +
    "match_id int," +
    "home text," +
    "away text," +
    "tournament_name text," +
    "country text," +
    "start_time timestamp," +
    "PRIMARY KEY (match_id) " +
    ") WITH COMPACTION = { 'class': 'LeveledCompactionStrategy' } AND " +
    "GC_GRACE_SECONDS = 864000";

var query3 = "CREATE TABLE match_has_user_predictions (" +
    "match_id int," +
    "user_id uuid," +
    "type int," +
    "type_text text," +
    "prediction text," +
    "PRIMARY KEY ((match_id, user_id), type)" +
    ") WITH COMPACTION = { 'class': 'LeveledCompactionStrategy' } AND " +
    "GC_GRACE_SECONDS = 864000";


var query4 = "CREATE TABLE results (" +
    "match_id int," +
    "goals_home int," +
    "goals_away int," +
    "canceled text," +
    "postponed text," +
    "PRIMARY KEY (match_id) " +
    ") WITH COMPACTION = { 'class': 'LeveledCompactionStrategy' } AND " +
    "GC_GRACE_SECONDS = 864000";

var create = function (client, callback) {
    client.execute(query, function (err, result) {
        if (err) {
            console.log(err);
        } else {
            console.log(query);
        }
        client.execute(query1, function (err, result) {
            if (err) {
                console.log(err);
            } else {
                console.log(query1);
            }
            client.execute(query2, function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(query2);
                }
                client.execute(query3, function (err, result) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(query3);
                    }
                    client.execute(query4, function (err, result) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(query4);
                        }
                        callback();
                    });
                });
            });
        });
    });
};

module.exports.create = create;

