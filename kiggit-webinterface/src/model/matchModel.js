'use strict';
var cassandra = require('cassandra-driver');
var async = require('async')
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

function upcoming(callback) {
    var query = "SELECT * FROM upcoming_matches WHERE scheduled_start_day = ?";
    var date = new Date(new Date().toDateString()).getTime();
    async.reduce([1,2,3,4,5,6,7,8,,9,10,11,12,13,14,15,16,17,18,19,20], [], function(matches, item, callback) {
        client.execute(query, [date],{prepare: true}, function(err, result) {
            if (err) {
                callback(err);
            } else {
                date = date + 86400000;
                callback(null, matches.concat(result.rows))
            }
        });
    }, function(err, result) {
        var newResult = result.map(function(r) {
            r.bettype = {};
            return r;
        })
        callback(newResult)
    });
}

module.exports.upcoming = upcoming;

