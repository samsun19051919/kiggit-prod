var query = "CREATE TABLE user (" +
    "user_id uuid," +
    "email text," +
    "password text," +
    "facebook_id text," +
    "first_name text," +
    "last_name text," +
    "country text," +
    "locale text," +
    "gender text," +
    "created timestamp," +
    "deleted timestamp," +
    "PRIMARY KEY (user_id)" +
    ") WITH " +
    "COMPACTION = { 'class': 'LeveledCompactionStrategy' } AND " +
    "GC_GRACE_SECONDS = 864000";

var query1 = "CREATE TABLE userByDeviceNotifierId (" +
    "notifierId text," +
    "userId text," +
    "PRIMARY KEY (notifierId)" +
    ") WITH " +
    "COMPACTION = { 'class': 'LeveledCompactionStrategy' } AND " +
    "GC_GRACE_SECONDS = 864000";

var query2 = "CREATE TABLE user_participates_in_betslip (" +
    "user_id uuid," +
    "betslip_id   uuid," +
    "betslip_name text," +
    "status    text," + // active or completed TODO: Fjern
    "PRIMARY KEY (user_id, betslip_id)" +
    ") WITH COMPACTION = { 'class': 'LeveledCompactionStrategy' } AND " +
    "GC_GRACE_SECONDS = 864000 AND " +
    "COMMENT = '" +
    "= Contains all betslips a user participates in (after acccepting an invite or creating a betslip).'";

var query3 = "CREATE TABLE user_invited_to_betslip (" +
    "user_id    uuid," +
    "betslip_id uuid," +
    "betslip_name text," +
    "PRIMARY KEY (user_id, betslip_id)" +
    ") WITH COMPACTION = { 'class': 'LeveledCompactionStrategy' } AND " +
    "GC_GRACE_SECONDS = 864000 AND " +
    "COMMENT = 'Contains invites to betslips.'";

var query4 = "CREATE INDEX facebook_id on user (facebook_id)";
var query5 = "CREATE INDEX email on user (email)";
var query6 = "CREATE INDEX firstname on user (first_name)";
var query7 = "CREATE INDEX lastname on user (last_name)";

var query8 = "CREATE TABLE money_counter(" +
    "counter_value counter," +
    "user_id uuid," +
    "PRIMARY KEY (user_id))";

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
                                    client.execute(query8, function (err, result) {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            console.log(query8);
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
    });
};

module.exports.create = create;