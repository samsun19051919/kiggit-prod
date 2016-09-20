'use strict';

var client = require('../database/dbClient').init();
var util = require('util');
var events = require('events');
var async = require('async');
var tools = require('../tools');
var log = tools.logger;

function Controller() {
    var self = this;


    this.deposit = function (user_id, amount, callback) {
        var query = 'UPDATE money_counter SET counter_value = counter_value + ? WHERE user_id = ?';
        client.execute(query, [amount, user_id],
            {prepare: true},
            function (err, res) {
                if (err) {
                    log.error(err.toString());
                    return callback(err);
                }
                callback();
            });
    };

    this.withdraw = function (user_id, amount, callback) {
        var query = 'UPDATE money_counter SET counter_value = counter_value - ? WHERE user_id = ?';
        client.execute(query, [amount, user_id],
            {prepare: true},
            function (err, res) {
                if (err) {
                    log.error(err.toString());
                    return callback(err);
                }
                callback();
            });
    };

    this.amount = function (user_id, callback) {
        var query = 'SELECT * FROM money_counter WHERE user_id = ?';
        client.execute(query, [user_id], {
            prepare: true
        }, function (err, res) {
            if (err || res.rows.length === 0) {
                return callback(null, 0);
            }
            return callback(null, parseInt(res.rows[0].counter_value));
        });
    };

    this.validateFunds = function (user_id, amount, callback) {
        var get_wallet_query = 'select counter_value from money_counter where user_id = ?';
        client.execute(get_wallet_query, [user_id], {
            prepare: true
        }, function (err, res) {
            if (err) {
                log.error && log.error('Failed to get wallet for user', data, err);
                return callback(err);
            }
            var wallet_size = res.rows[0].counter_value;
            if (wallet_size < amount) {
                callback(null, false);
            }
            else {
                callback(null, true);
            }
        });
    };


}
util.inherits(Controller, events.EventEmitter);
module.exports = new Controller();
