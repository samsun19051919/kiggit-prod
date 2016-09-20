var query = "CREATE TABLE prediction (" +
    "type int," +
    "type_text text," +
    "PRIMARY KEY (type)" +
    ") WITH COMPACTION = { 'class': 'LeveledCompactionStrategy' } AND " +
    "GC_GRACE_SECONDS = 864000";

var query1 = "INSERT INTO prediction (type, type_text) VALUES (1, 'result')";
var query2 = "INSERT INTO prediction (type, type_text) VALUES (2, 'outcome')";
var query3 = "INSERT INTO prediction (type, type_text) VALUES (3, 'goalscorer')";

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
                    callback();
                });
            });

        });
    });
}
module.exports.create = create;