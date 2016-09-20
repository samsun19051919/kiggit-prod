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

function all(callback) {
    var query = "SELECT * FROM betslip";
    client.execute(query, {
        prepare: true
    }, function(err, result) {
        if (err) {
            console.error('betslipModel: getAll error. ' + err);
            callback(err);
        } else {
            callback(result.rows);
        }
    });
}

module.exports.all = all;