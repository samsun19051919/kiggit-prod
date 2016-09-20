'use strict';

var log = require('../tools').logger;
var matchController = require('../controller/match');
var predictionsController = require('../controller/predictions');
var util = require('util');
var events = require('events');
var async = require('async');
var betslipController = require('../controller/betslip');
var userController = require('../controller/user');
var client = require('../database/dbClient').init();

function MatchResponder() {
    var self = this;

    /**
     * Retrieve upcoming matches.
     *
     * @param  {object}   ws       The web socket we're communicating on
     * @param  {object}   data     JSON payload
     * @param  {function} callback Callback
     * @return {void}
     */
    this.fetchUpcoming = function (ws, data, callback) {
        if (!data.date) {
            log.debug && log.debug('match.fetchUpcoming', 'Rejecting request with insufficient or bad data', data);
            return callback(null, {status: 400, errorMsg: 'Rejecting request with insufficient or bad data', requiredFields: ['date']});
        }
        var date = data.date;

        //var date = Date.parse('2016-01-24 00:00:00+0100');
        log.debug(date);
        matchController.getUpcoming(date, function (err, res) {
            /* Internal error */
            if (err) {
                log.error && log.error('MatchResponder.fetchUpcoming', 'Failed to get upcoming matches', err, res);
                return callback(err);
            }

            /* Sort by country ASC, then setting ASC on international matches, then scheduled_start ASC. */
            res.sort(function (a, b) {
                var ac = a.country || '',
                    bc = b.country || '';

                if (ac !== bc)
                    return ac.localeCompare(bc);

                if (ac === 'International' && a.setting !== b.setting)
                    return (a.setting || '').localeCompare(b.setting || '');

                return a.scheduled_start - b.scheduled_start;
            });

            callback(null, {status: 200, data: res});
        });
    };
}

util.inherits(MatchResponder, events.EventEmitter);
module.exports = new MatchResponder();