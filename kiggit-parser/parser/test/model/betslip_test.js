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

var queryInsert = "INSERT INTO betslip (betslip_id, bet_size, status, creator, created, start_time) " +
    "VALUES (?,?,?,?,?,?)";
var queryInsertMatch1 = "INSERT INTO betslip_has_matches (betslip_id, match_id, tournament_name, home, away, country, start_time)" +
    "VALUES (?,?,?,?,?,?,?)";
var queryInsertMatch2 = "INSERT INTO match_in_betslips (match_id, betslip_id) VALUES (?,?)";
var queryUpdateResolved = "INSERT INTO settled_betslips (betslip_id, resolved) VALUES (?,?)";
var queryGet = "SELECT * FROM betslip WHERE betslip_id = ?";
var queryGetSettled = "SELECT * FROM settled_betslips WHERE betslip_id = ?";
var queryTruncate1 = 'TRUNCATE betslip';
var queryTruncate2 = 'TRUNCATE betslip_has_matches';
var queryTruncate3 = 'TRUNCATE match_in_betslips';
var queryTruncate4 = 'TRUNCATE settled_betslips';
var queryTruncate5 = 'TRUNCATE betslip_leaderboard';

function insertBetslip(data, callback) {
    client.execute(queryInsert, [data.betslip_id, data.bet_size, data.status, data.creator, data.created, data.start_time], {
        prepare: true
    }, function(err) {
        if (err) {
            console.log('insertBetslip err: ' + err);
            return callback(err);
        }
        callback();
    });
}

function insertMatchInBetslip(betslip_id, match, callback) {
    client.execute(queryInsertMatch1, [betslip_id,
        match.match_id,
        match.tournament_name,
        match.home,
        match.away,
        match.country,
        match.start_time
    ], {
        prepare: true
    }, function(err) {
        if (err) {
            console.log('insertMatchInBetslip test model error' + err);
            return callback(err);
        }
        client.execute(queryInsertMatch2, [match.match_id,
            betslip_id
        ], {
            prepare: true
        }, function(err) {
            if (err) {
                console.log('insertMatchIn match in betslip test model error' + err);
                return callback(err);
            }
            callback();
        });
    });
}

function get(betslip_id, callback) {
    client.execute(queryGet, [betslip_id], function(err, result) {
        if (err) {
            console.error('betslip model test get error. ' + err);
            callback(err);
        } else {
            callback(result);
        }
    });
}

function getSettled(betslip_id, callback) {
    client.execute(queryGetSettled, [betslip_id], function(err, result) {
        if (err) {
            console.error('betslip model test get error. ' + err);
            callback(err);
        } else {
            callback(result);
        }
    });
}

function updateResolved(betslip_id, status, callback) {
    client.execute(queryUpdateResolved, [betslip_id, status], {
        prepare: true
    }, function(err) {
        if (err) {
            console.log('updateResolved test model error' + err + ' ' + betslip_id);
            return callback(err);
        }
        callback();
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
                                    callback(result);
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

module.exports.insertBetslip = insertBetslip;
module.exports.insertMatchInBetslip = insertMatchInBetslip;
module.exports.get = get;
module.exports.getSettled = getSettled;
module.exports.updateResolved = updateResolved;
module.exports.truncate = truncate;