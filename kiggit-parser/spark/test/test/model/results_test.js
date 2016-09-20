'use strict';
var cassandra = require('cassandra-driver');
var client = new cassandra.Client({ contactPoints: config.kiggit.hosts, keyspace: config.kiggit.keyspace});


client.connect(function (err) {
	if (err){
		console.log("could not connect to cassandra");
	} else {
		console.log("Connected to cassandra");
	}
});

var queryCount = 'SELECT count(*) FROM results';
var queryMatch = 'SELECT * FROM results';
var queryTruncate = 'TRUNCATE results';

function countResults (callback) {
    client.execute(queryCount, function (err, result) {
        if (err) {
            console.error('results_test error. ' + err);
            callback(err);
        } else {
        	callback(result.rows[0].count + '');
        }
    });
}
function getResult (callback) {
    client.execute(queryMatch, function (err, result) {
        if (err) {
            console.error('getResults error. ' + err);
            callback(err);
        } else {
            callback(result);
        }
    });
}
function truncate (callback) {
    client.execute(queryTruncate, function (err, result) {
        if (err) {
            console.error('results_test error. ' + err);
            callback(err);
        } else {
            callback(result);
        }
    });
}

module.exports.countResults = countResults;
module.exports.getResult = getResult;
module.exports.truncate = truncate;
