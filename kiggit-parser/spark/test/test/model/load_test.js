"use strict";
var cassandra = require('cassandra-driver');
var fs = require('fs');
var async = require('async');
var lineReader = require('line-reader');

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

var queryTruncate1 = 'TRUNCATE betslip';
var queryTruncate2 = 'TRUNCATE betslip_has_matches';
var queryTruncate3 = 'TRUNCATE match_in_betslips';
var queryTruncate4 = 'TRUNCATE settled_betslips';
var queryTruncate5 = 'TRUNCATE results';


function load(query, file, callback) {

    const readline = require('readline');
    const rl = readline.createInterface({
        input: fs.createReadStream(file)
    });
    rl.on('line', function(line) {
        console.log(line.split(','));
        client.execute(query, line.split(','), {
            prepare: true
        }, function(err) {
            if (err) {
                console.log('loading data err: ' + file + ' err: ' + err);
                return callback(err);
            }
            callback();
        });
    });

}

function truncate(callback) {
    client.execute(queryTruncate1, function(err) {
        if (err) {
            console.error('betslip model test truncate error 1: ' + err);
            callback(err);
        } else {
            client.execute(queryTruncate2, function(err) {
                if (err) {
                    console.error('betslip model test truncate error 2:  ' + err);
                    callback(err);
                } else {
                    client.execute(queryTruncate3, function(err) {
                        if (err) {
                            console.error('betslip model test truncate error 3:  ' + err);
                            callback(err);
                        } else {
                            client.execute(queryTruncate4, function(err, result) {
                                if (err) {
                                    console.error('betslip model test truncate error 4:  ' + err);
                                    callback(err);
                                } else {
                                    client.execute(queryTruncate5, function(err, result) {
                                        if (err) {
                                            console.error('betslip model test truncate error 5:  ' + err);
                                            callback(err);
                                        } else {
                                            callback(result);
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

module.exports.load = load;
module.exports.truncate = truncate;