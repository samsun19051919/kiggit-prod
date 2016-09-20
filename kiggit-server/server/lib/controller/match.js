'use strict';

var client = require('../database/dbClient').init();
var konfig = require('../../konfig');
var tools = require('../tools');
var log = tools.logger;
var async = require('async');

/**
 * Formats a match for client consumption.
 *
 * @param  {object} m Objectified match instance.
 * @return {object}   Match object formatted for the client.
 */
function Controller() {

    var self = this;

    /**
     * Get all upcoming matches for the given date.
     *
     * @param {timestamp} date
     * @param  {function} callback
     * @return List of upcoming matches - if none then []
     */
    this.getUpcoming = function (date, callback) {
        var query = 'SELECT * FROM upcoming_matches WHERE scheduled_start_day = ?';
        client.execute(query, [new Date(date)], {prepare: true},
            function (err, res) {
                if (err) {
                    log.error(err.toString());
                    return callback(err);
                }
                callback(null, res.rows);
            });
    };

    this.getMatchResult = function (match_id, callback) {
        var query = 'SELECT * FROM results WHERE match_id = ?';
        client.execute(query, [match_id], {prepare: true},
            function (err, res) {
                if (err || !res.rows) {
                    log.error(err.toString());
                    return callback(err);
                }
                callback(null, res.rows);
            });
    };


    /**
     * Get all matches matches for the given date.
     *
     * @param {timestamp} date
     * @param  {function} callback
     * @return List of upcoming matches - if none then []
     */
    this.getMatchesForBetslip = function (betslip_id, callback) {
        var query = 'SELECT * FROM betslip_has_matches WHERE betslip_id = ?';
        client.execute(query, [betslip_id], {prepare: true},
            function (err, res) {
                if (err) {
                    log.error(err.toString());
                    return callback(err);
                }

                callback(null, res.rows);
            });
    };

};

module.exports = new Controller();
