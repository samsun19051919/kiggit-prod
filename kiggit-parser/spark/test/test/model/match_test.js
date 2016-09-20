"use strict";
var cassandra = require('cassandra-driver');
var client = new cassandra.Client({
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

var queryCount = 'SELECT count(*) FROM match ';
var queryMatch = 'SELECT * FROM match ';
var queryTruncate = 'TRUNCATE match';

function countMatches(callback) {
    client.execute(queryCount, function(err, result) {
        if (err) {
            console.error('match_test error. ' + err);
            callback(err);
        } else {
            callback(result.rows[0].count + '');
        }
    });
}

function getMatch(callback) {
    client.execute(queryMatch, function(err, result) {
        if (err) {
            console.error('getMatch error. ' + err);
            callback(err);
        } else {
            callback(result);
        }
    });
}

function truncate(callback) {
    client.execute(queryTruncate, function(err, result) {
        if (err) {
            console.error('match_test error. ' + err);
            callback(err);
        } else {
            callback(result);
        }
    });
}

module.exports.countMatches = countMatches;
module.exports.getMatch = getMatch;
module.exports.truncate = truncate;