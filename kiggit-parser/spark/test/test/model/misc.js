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

function getMoney(user_id, callback) {
    var queryGetMoney = "SELECT * FROM money_counter WHERE user_id = ?";
    client.execute(queryGetMoney, [user_id], {prepare: true}, function(err, result) {
        if (err) {
            console.error('betslip model test get error. ' + err);
            callback(err);
        } else {
            callback(result.rows[0].counter_value.toString());
        }
    });
}

module.exports.getBetslipLeaderboard = function getBetslipLeaderboard(betslip_id, callback) {
    var query = "SELECT * FROM betslip_leaderboard WHERE betslip_id = ?";
    client.execute(query, [betslip_id], {prepare: true}, function(err, result) {
        if (err) {
            console.error('betslipLeaderboard model test get error. ' + err);
            callback(err);
        } else {
            callback(result);
        }
    });
}
function getTransaction(user_id, betslip_id, callback) {
    var queryGetTransaction = "SELECT * FROM  user_transactions_on_betslips WHERE user_id = ? AND betslip_id = ?";
    client.execute(queryGetTransaction, [user_id, betslip_id], {prepare: true},  function(err, result) {
        if (err) {
            console.error('betslip model test get error. ' + err);
            callback(err);
        } else {
            callback(result.rows[0].amount);
        }
    });
}

module.exports.getWinners = function (betslip_id, callback) {
    var query = "SELECT * FROM winners WHERE betslip_id = ?";
    client.execute(query, [betslip_id], {prepare: true}, function(err, result) {
        if (err) {
            console.error('betslip model test get winnerserror. ' + err);
            callback(err);
        } else {
            callback(result.rows);
        }
    });
}

module.exports.getMoney = getMoney;
module.exports.getTransaction= getTransaction;
