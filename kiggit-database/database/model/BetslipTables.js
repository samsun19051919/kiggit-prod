/* Contains betslips */
var query = "CREATE TABLE betslip (" +
    "betslip_id uuid," +
    "bet_size   int," +
    "status     text," + // open, started, settled
    "creator    uuid," +
    "created    timestamp," +
    "start_time    timestamp," +
    "PRIMARY KEY (betslip_id)" +
    ") WITH COMPACTION = { 'class': 'LeveledCompactionStrategy' } AND " +
    "GC_GRACE_SECONDS = 864000";

/* Contains user who joined a betslip. */
var query1 = "CREATE TABLE betslip_participants (" +
    "betslip_id uuid," +
    "user_id    uuid," +
    "PRIMARY KEY (betslip_id, user_id) " +
    ") WITH COMPACTION = { 'class': 'LeveledCompactionStrategy' } AND " +
    "GC_GRACE_SECONDS = 864000";

/* Contains invites to betslip */
var query2 = "CREATE TABLE betslip_invites (" +
    "betslip_id uuid," +
    "user_id    uuid," +
    "status     text," +
    "PRIMARY KEY (betslip_id, user_id)" +
    ") WITH COMPACTION = { 'class': 'LeveledCompactionStrategy' } AND " +
    "GC_GRACE_SECONDS = 864000";

/* Contains deciding matches for a betslip. */
var query3 = "CREATE TABLE match_decides_betslip (" +
    "match_id int," +
    "betslip_id uuid," +
    "PRIMARY KEY (match_id, betslip_id)" +
    ") WITH COMPACTION = { 'class': 'LeveledCompactionStrategy' } AND " +
    "GC_GRACE_SECONDS = 864000";

/* Contains all betslips that a user has created */
var query4 = "CREATE TABLE user_created_betslip (" +
    "user_id      uuid," +
    "betslip_id   uuid," +
    "PRIMARY KEY (user_id, betslip_id)" +
    ") WITH COMPACTION = { 'class': 'LeveledCompactionStrategy' } AND " +
    "GC_GRACE_SECONDS = 864000";

var query5 = "CREATE TABLE potsize_counter(" +
    "counter_value counter," +
    "betslip_id uuid," +
    "PRIMARY KEY (betslip_id))";

var query6 = "CREATE TABLE betslip_has_matches (" +
    "betslip_id uuid," +
    "match_id int," +
    "tournament_name text," +
    "home text," +
    "away text," +
    "country text," +
    "start_time timestamp," +
    "PRIMARY KEY (betslip_id, match_id)" +
    ") WITH COMPACTION = { 'class': 'LeveledCompactionStrategy' } AND " +
    "GC_GRACE_SECONDS = 864000";

/* Contains all betslips which has been setlled */
var query7 = "CREATE TABLE setlled_betslips (" +
    "setlled_time timestamp," +
    "resolved boolean," +  //True if the betslip has been calculated
    "betslip_id uuid," +
    "PRIMARY KEY (betslip_id)" +
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
                        client.execute(query5, function (err, result) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log(query5);
                            }
                            client.execute(query6, function (err, result) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log(query6);
                                }
                                client.execute(query7, function (err, result) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        console.log(query7);
                                    }
                                    callback();
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};

module.exports.create = create;
