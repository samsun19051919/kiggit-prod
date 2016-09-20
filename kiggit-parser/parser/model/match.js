'use strict';
var cassandra = require('cassandra-driver');
var client = new cassandra.Client({
    contactPoints: config.kiggit.hosts,
    keyspace: config.kiggit.keyspace
});
var util = require('util');
client.connect(function(err) {
    if (err) {
        console.log("could not connect to cassandra");
    } else {
        console.log("Connected to cassandra");
    }
});
var queryGetBetslips = "SELECT * FROM match_in_betslips WHERE match_id = ?";
var queryResolved = "SELECT * FROM result";
var query = "INSERT INTO match (scheduled_start_day, match_id, home, away, tournament_name, country, start_time) " +
    "VALUES (?,?,?,?,?,?,?)";

function insertMatch(match, callback) {
    var params = [new Date(match.scheduled_start_day).getTime(),
        match.match_id,
        match.home,
        match.away,
        match.tournament_name,
        match.country,
        match.scheduled_start
    ];

    client.execute(query, params, {
        prepare: true,
        timestamp: new Date(match.updated).getTime()
    }, function(err) {
        if (err) {
            console.error(err);
            return callback(err);
        }
        console.log('updated match in match table ' + match.match_id);
        callback();
    });
}

function getBetslips(match_id, callback) {
    client.execute(queryGetBetslips, [match_id], {
        prepare: true
    }, function(err, result) {
        if (err) {
            console.error('match getBetslips error. ' + err + '. match_id: ' + util.inspect(match_id, false, null));
            callback(err);
        } else {
            callback(result);
        }
    });
}

function isResolved(match_id, callback) {
    client.execute(queryResolved, [match_id], {
        prepare: true
    }, function(err, result) {
        if (err) {
            console.error('match is resolved error. ' + err);
            callback(err);
        } else {
            callback(result);
        }
    });
}

module.exports.insertMatch = insertMatch;
module.exports.getBetslips = getBetslips;
module.exports.isResolved = isResolved;
