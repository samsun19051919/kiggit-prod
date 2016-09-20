'use strict';

var self;
var tools      = require('../tools');
var log        = tools.logger;
var util = require('util');
var events = require('events');
var client = require('../database/dbClient').init();
var async = require('async');

function Controller() {
    self = this;

    this.getFunfact = function (user_id, callback) {
        var query = "SELECT * FROM user_funfacts WHERE user_id = ?";
        client.execute(query, [user_id], {prepare: true},
            function (err, res) {
                if (err) {
                    log.error(err.toString());
                    return callback(err);
                }
                callback(null, res.rows[0]);
            });
    };


};


util.inherits(Controller, events.EventEmitter);
module.exports = new Controller();