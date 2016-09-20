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

function getFunfacts(callback) {
    var query = 'SELECT * FROM user_funfacts'
    client.execute(query, function(err, result) {
        if (err) {
            console.error('getFunfacts error. ' + err);
            callback(err);
        } else {
            callback(result);
        }
    });
}

module.exports.getFunfacts = getFunfacts;