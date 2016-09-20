'use strict';
var util = require('util')
var cassandra = require('cassandra-driver');
var client = new cassandra.Client({
    //contactPoints: config.kiggit.hosts,
    //keyspace: config.kiggit.keyspace
    contactPoints: config.kiggit.hosts,
    keyspace: config.kiggit.keyspace
});
client.connect(function(err) {
    if (err) {
        console.log("could not connect to cassandra");
    } else {
        console.log("Connected to cassandra");
    }
});

function insert(mresult, callback) {
    var query = "INSERT INTO results (match_id, goals_home, goals_away, canceled, postponed, result) " +
        "VALUES (?,?,?,?,?,?)";
    var params = [mresult.match_id,
                  mresult.goals_home,
                  mresult.goals_away,
                  mresult.canceled,
                  mresult.postponed,
                  mresult.result]
    client.execute(query, params, {
            prepare: true,
            timestamp: new Date(mresult.updated).getTime(),
            consistency: cassandra.types.consistencies.quorum
        },
        function(err, result) {
            if (err) {
                console.log(err);
                callback(err);
           } else {
                callback();
            }
        }
    );
}
function get(match_id, callback) {
    var queryGet = "SELECT * FROM results WHERE match_id = ?";
    client.execute(queryGet, [match_id], {
            prepare: true,
            consistency: cassandra.types.consistencies.quorum
        },
        function(err, result) {
            if (err) {
                console.log(err);
                return callback(err);
            }
            callback(result);
        });
}
module.exports.insert = insert;
module.exports.get = get;
