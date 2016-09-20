'use strict';

var client = require('../database/dbClient').init();
var util = require('util');
var events = require('events');
var async = require('async');
var tools = require('../tools');
var log = tools.logger;
var userController = require('./user');

function Controller() {
    var self = this;

    this.getclosedBetslips = function (betslips, callback) {
        var closedBetslips = [];
        async.each(betslips, function (betslip, cb) {
            var query = "SELECT status, bet_size, creator, betslip_type, settle_time, start_time FROM betslip WHERE betslip_id = ?";
            client.execute(query, [betslip.betslip_id], {prepare: true},
                function (err, res) {
                    if (err) {
                        log.error(err);
                        return cb(err);
                    }
                    if (res.rows[0].status === 'settled' || res.rows[0].status === 'resolved') {
                        betslip.start_time = res.rows[0].start_time;
                        betslip.status = res.rows[0].status;
                        betslip.buy_in = res.rows[0].bet_size;
                        betslip.betslip_type = res.rows[0].betslip_type;
                        betslip.settle_time = res.rows[0].settle_time;
                        userController.getProfilePicUrl(res.rows[0].creator, function (err, res1) {
                            betslip.creator_pic_url = res1;
                            self.getBetslipWinnerIds(betslip.betslip_id, function (err, winners) {
                                betslip.winners = winners;

                                userController.getByUserId(res.rows[0].creator, function (err, user) {
                                    betslip.creator_facebook_id = user.rows[0].facebook_id;
                                    closedBetslips.push(betslip);
                                    cb();
                                });
                            });
                        });
                    }
                    else {
                        cb();
                    }
                });
        }, function (err) {
            callback(null, closedBetslips);
        });
    };

    this.getActiveBetslips = function (betslips, callback) {
        var activeBetslips = [];
        async.each(betslips, function (betslip, cb) {
            var query = "SELECT status, bet_size, creator, betslip_type, start_time FROM betslip WHERE betslip_id = ?";
            client.execute(query, [betslip.betslip_id], {prepare: true},
                function (err, res) {
                    if (err) {
                        log.error(err);
                        return cb(err);
                    }

                    if (res.rows[0].status === 'open' || res.rows[0].status === 'started') {
                        betslip.start_time = res.rows[0].start_time;
                        betslip.status = res.rows[0].status;
                        betslip.buy_in = res.rows[0].bet_size;
                        betslip.betslip_type = res.rows[0].betslip_type;
                        userController.getProfilePicUrl(res.rows[0].creator, function (err, res1) {
                            betslip.creator_pic_url = res1;
                            userController.getByUserId(res.rows[0].creator, function (err, user) {
                                betslip.creator_facebook_id = user.rows[0].facebook_id;
                                activeBetslips.push(betslip)
                                cb();
                            });
                        });
                    }
                    else {
                        cb();
                    }
                });
        }, function (err) {
            callback(null, activeBetslips);
        });
    };

    this.getAwaitingBetslips = function (user_id, callback) {
        var participates_to_betslips = "SELECT * FROM user_invited_to_betslip WHERE user_id = ?";
        client.execute(participates_to_betslips, [user_id],
            {prepare: true},
            function (err, res) {
                if (err) {
                    log.error && log.error('BetslipResponder.fetchBetslipa', 'Failed to get betslips which user is invited to', data, err);
                    return callback(null, []);
                }
                if (!res.rows) {
                    return callback(null, []);
                }
                var awaitingBetslips = [];
                async.each(res.rows, function (betslip, cb) {
                    var query = "SELECT start_time, bet_size, creator, betslip_type, start_time FROM betslip WHERE betslip_id = ?";
                    client.execute(query, [betslip.betslip_id], {prepare: true},
                        function (err, res) {
                            if (err) {
                                log.error(err);
                                return cb(err);
                            }
                            if (new Date() < new Date(res.rows[0].start_time)) {
                                betslip.start_time = res.rows[0].start_time;
                                betslip.status = res.rows[0].status;
                                betslip.buy_in = res.rows[0].bet_size;
                                betslip.betslip_type = res.rows[0].betslip_type;
                                userController.getProfilePicUrl(res.rows[0].creator, function (err, res1) {
                                    betslip.creator_pic_url = res1;
                                    userController.getByUserId(res.rows[0].creator, function (err, user) {
                                        betslip.creator_facebook_id = user.rows[0].facebook_id;
                                        awaitingBetslips.push(betslip)
                                        cb();
                                    });
                                });
                            }
                            else {
                                cb();
                            }
                        });
                }, function (err) {
                    callback(null, awaitingBetslips);
                });
            });
    };

    this.getPotSize = function (betslip_id, callback) {
        var query = 'SELECT counter_value FROM potsize_counter WHERE betslip_id = ?';
        client.execute(query, [betslip_id], {prepare: true},
            function (err, res) {
                if (err || res.rows.length === 0) {
                    return callback(null, 0);
                }
                return callback(null, parseInt(res.rows[0].counter_value));
            });
    };

    this.getParticipantsCount = function (betslip_id, callback) {
        var query = "SELECT * FROM betslip_participants WHERE betslip_id = ?";
        client.execute(query, [betslip_id], {prepare: true},
            function (err, res) {
                if (err || !res.rows) {
                    return callback(null, 0);
                }
                return callback(null, res.rows.length);
            });
    };

    this.isBetslipActive = function (betslip_id, callback) {
        var states = ['open', 'started'];
        var query = "SELECT status FROM betslip";
        client.execute(query, [betslip_id], {prepare: true},
            function (err, res) {
                if (err) {
                    return callback(null, false);
                }
                if (states.indexOf(res) > -1) {
                    return callback(null, true);
                }
                else {
                    return callback(null, false);
                }
            });
    };

    this.getBetslip = function (betslip_id, callback) {
        var query = 'SELECT * FROM betslip WHERE betslip_id = ?';
        client.execute(query, [betslip_id], {prepare: true},
            function (err, res) {
                if (err) {
                    log.error(err.toString());
                    return callback(err);
                }
                callback(null, res);
            });
    };

    this.insertTransaction = function (user_id, betslip_id, amount, callback) {
        var query = 'INSERT INTO user_transactions_on_betslips (user_id, betslip_id, amount) ' +
            'VALUES (?,?,?)';
        client.execute(query, [user_id, betslip_id, amount], {prepare: true},
            function (err, res) {
                if (err) {
                    log.error(err.toString());
                    return callback(err);
                }
                callback(null, res);
            });
    };

    this.getParticipants = function (betslip_id, betslip_status, callback) {
        var query = "SELECT * FROM betslip_participants WHERE betslip_id = ?";
        client.execute(query, [betslip_id], {prepare: true},
            function (err, res) {
                if (err || !res.rows || res.rows.length === 0) {
                    return callback(null, []);
                }
                var participants = [];
                async.each(res.rows, function (participant, cb) {
                    userController.getByUserId(participant.user_id, function (err, res) {
                        if (err || !res.rows || res.rows.length === 0) {
                            cb();
                        }
                        var user = res.rows[0];
                        if (betslip_status === 'settled') {
                            self.getResultForUser(betslip_id, user.user_id, function (err, res) {
                                if (!res || !res.rows || res.rows.length === 0) {
                                    participants.push({
                                        user_id: user.user_id, first_name: user.first_name,
                                        last_name: user.last_name, facebook_id: user.facebook_id
                                    });
                                    cb();
                                }
                                else {
                                    participants.push({
                                        user_id: user.user_id, first_name: user.first_name,
                                        last_name: user.last_name, facebook_id: user.facebook_id,
                                        position: res[0].position, amount: res[0].amount
                                    });
                                    cb();
                                }
                            });
                        }
                        else {
                            participants.push({
                                user_id: user.user_id, first_name: user.first_name,
                                last_name: user.last_name, facebook_id: user.facebook_id
                            });
                            cb();
                        }
                    });
                }, function (err) {
                    return callback(null, participants);
                });
            });
    };

    this.getWinningsForUser = function (user_id, betslip_id, callback) {
        var query = "SELECT * FROM user_transactions_on_betslips WHERE user_id = ? and betslip_id = ?";
        client.execute(query, [user_id, betslip_id], {prepare: true},
            function (err, res) {
                if (err || !res.rows || res.rows.length === 0) {
                    return callback(null, 0);
                }
                else {
                    if (res.rows[0].amount > 0) {
                        return callback(null, res.rows[0].amount);
                    }
                    else {
                        return callback(null, res.rows[1].amount);
                    }
                }

            });
    };

    this.getBetslipWinnerIds = function (betslip_id, callback) {
        var query = "SELECT user_id FROM winners WHERE betslip_id = ?";
        client.execute(query, [betslip_id], {prepare: true},
            function (err, res) {
                if (err || !res.rows || res.rows.length === 0) {
                    return callback(null, []);
                }
                else {
                    return callback(null, res.rows);
                }

            });
    };

    this.getResultForUser = function (betslip_id, user_id, callback) {
        var query = "SELECT * FROM winners WHERE betslip_id = ? and user_id = ?";
        client.execute(query, [betslip_id, user_id], {prepare: true},
            function (err, res) {
                if (err || !res.rows || res.rows.length === 0) {
                    return callback(null, []);
                }
                else {
                    return callback(null, res.rows);
                }

            });
    };

    this.getParticipatesCount = function (user_id, callback) {
        var query = "SELECT * FROM user_participates_in_betslip WHERE user_id = ?";
        client.execute(query, [user_id], {prepare: true},
            function (err, res) {
                if (err || !res.rows || res.rows.length === 0) {
                    return callback(null, {user_id: user_id, score: 0});
                }
                else {
                    return callback(null, {user_id: user_id, score: res.rows.length});
                }

            });
    };

    this.getActiveKiggitBetslips = function (callback) {
        var activeKiggitBetslips = [];
        var query = "SELECT * FROM betslip WHERE betslip_type = ?";
        client.execute(query, ['kiggit'], {prepare: true},
            function (err, betslips) {
                if (err) {
                    log.error(err);
                    return cb(err);
                }
                async.each(betslips.rows, function (betslip, cb) {
                    if (betslip.status === 'open' || betslip.status === 'started') {
                        activeKiggitBetslips.push(betslip)
                        cb();
                    }
                    else {
                        cb();
                    }
                }, function (err) {
                    callback(null, activeKiggitBetslips);
                });

            });
    };
}
util.inherits(Controller, events.EventEmitter);
module.exports = new Controller();
