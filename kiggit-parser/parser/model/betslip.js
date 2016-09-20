'use strict';
var cassandra = require('cassandra-driver');
var client = new cassandra.Client({
    contactPoints: config.kiggit.hosts,
    keyspace: config.kiggit.keyspace
});
client.connect(function(err) {
    if (err) {
        console.log("could not connect to cassandra error: " + err);
    } else {
        console.log("Connected to cassandra hosts: " + config.kiggit.hosts);
    }
});

var queryGet = "SELECT * FROM betslip WHERE betslip_id = ?";

var queryGetMatches = 'SELECT * FROM betslip_has_matches WHERE betslip_id = ?';
var queryGetSettled = "SELECT * FROM settled_betslips WHERE betslip_id = ?";
var querySettle1 = "INSERT INTO settled_betslips (betslip_id, resolved, settled_time)" +
    "VALUES (?,?,?)";
var querySettle2 = "INSERT INTO betslip (betslip_id, settle_time, status) VALUES (?,?,?)";

function getMatches(betslip_id, callback) {
    client.execute(queryGetMatches, [betslip_id], {
        prepare: true
    }, function(err, result) {
        if (err) {
            console.error('betslip getMatches err: ' + err);
        }
        callback(result);
    });
}

function getSettled(betslip_id, callback) {
    client.execute(queryGetSettled, [betslip_id], function(err, result) {
        if (err) {
            console.error('Betslip model getSettled betslip error: ' + err);
            callback(err);
        } else {
            callback(result);
        }
    });
}

function get(betslip_id, callback) {
    client.execute(queryGet, [betslip_id], {
        prepared: true
    }, function(err, result) {
        if (err) {
            console.error('Betslip model get error: ' + err);
            callback(err);
        } else {
            callback(result);
        }
    });
}

function settle(betslip_id, callback) {
    client.execute(querySettle1, [betslip_id, false, new Date().getTime()], {
        prepare: true
    }, function(err) {
        if (err) {
            console.log('settle betslip model error1: ' + err);
            return callback(err);
        }
        client.execute(querySettle2, [betslip_id, new Date().getTime(), 'settled'], {
            prepare: true
        }, function(err) {
            if (err) {
                console.log('settle betslip model error2: ' + err);
                return callback(err);
            }
            callback();
        });
    });
}

module.exports.get = get;
module.exports.getSettled = getSettled;
module.exports.settle = settle;
module.exports.getMatches = getMatches;
