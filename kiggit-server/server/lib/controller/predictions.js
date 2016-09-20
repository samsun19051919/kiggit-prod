'use strict';

var client = require('../database/dbClient').init();
var konfig = require('../../konfig');
var tools = require('../tools');
var log = tools.logger;
var async = require('async');
var util = require('util');
var events = require('events');

function Controller() {
    var self = this;


  /*  this.fetchForMatch = function (match_id, user_id, callback) {
        var response = {}, winners = [], results = [], goalscorers = [], predictions = [];

        var match_query = "SELECT * FROM match WHERE match_id = ?";
        //var query = 'SELECT type, type_text, prediction FROM match_has_user_predictions WHERE match_id = ? AND user_id = ?';
        client.execute(match_query, [match_id], {prepare: true},
            function (err, res) {
                if (err) {
                    log.error(err.toString());
                    return callback(err);
                }
                async.each(res.rows, function (_match, cb) {
                    var match = {};
                    match.match_id = _match.match_id;
                    match.home = _match.home;
                    match.away = _match.away;
                    match.country = _match.country;
                    match.start_time = _match.start_time;
                    match.tournament_name = tournament_name;




                    winners.push(match);
                    cb();
                }, function (err) {
                    predictions.push(winners);
                    response.predictions = predictions;

                });
            });
    };*/

    this.fetchIdForPrediction = function (prediction_text, callback) {
        var query = 'SELECT * FROM prediction WHERE prediction_text = ?';
        client.execute(query, [prediction_text],
            {prepare: true}, function (err, res) {
                if (err) {
                    log.error(err.toString());
                    return callback(err);
                }
                if (res.rows && res.rows.lenght > 0) {
                    return callback(null, res.rows[0]);
                }
                else {
                    var prediction_id = uuid.v4();
                    var query = "INSERT INTO prediction (prediction_id, prediction_text) " +
                        "VALUES (?,?)";
                    client.execute(query, [prediction_id, prediction_text],
                        {prepare: true}, function (err, res) {
                            if (err) {
                                log.error(err.toString());
                                return callback(err);
                            }
                            callback(null, prediction_id);
                        });
                }
            });
    };
}

util.inherits(Controller, events.EventEmitter);
module.exports = new Controller();