var uuid = require("node-uuid");
var async = require("async");
var util = require('util');
var events = require('events');
var tools = require('../tools');
var log = tools.logger;
var client = require('../database/dbClient').init();
var betslipController = require('../controller/betslip');
var userController = require('../controller/user');
var matchController = require('../controller/match');
var walletController = require('../controller/wallet');
var Logger = require('../../util/Logger');

function BetslipResponder() {
    var self = this;


    this.create = function (ws, data, callback) {
        if (!data.creator || !data.bet_size || !data.betslip_type || !data.predictions) {
            log.debug && log.debug('BetslipResponder.fetchBetslip', 'Rejecting request with insufficient or bad data', data);
            return callback(null, {
                status: 400,
                errorMsg: 'Rejecting request with insufficient or bad data',
                requiredFields: ['creator', 'bet_size', 'betslip_type', 'predictions']
            });
        }
        else if (data.predictions.length === 0) {
            return callback(null, {
                status: 400,
                errorMsg: 'No matches found in request'
            });
        }
        else {
            var betslip_id = uuid.v4();
            var now = new Date();
            // Choose date in the future to find first match.start_time
            var start_time = new Date();
            start_time.setDate(start_time.getDate() + 300);

            async.each(data.predictions, function (prediction, cb) {
                    log.debug(prediction);

                    var get_match_query = 'SELECT * FROM match WHERE match_id = ?';
                    client.execute(get_match_query, [prediction.match_id], {
                        prepare: true
                    }, function (err, res) {
                        if (err || !res || !res.rows || res.rows.length === 0) {
                            log.error && log.error('BetslipResponder.createBetslip', 'Failed to get match in betslip', data, err);
                            return cb();
                        }

                        var found_match = res.rows[0];
                        var match_date = new Date(found_match.start_time);
                        if (match_date < start_time) {
                            start_time = match_date;
                        }
                        var betslip_matches_query = 'INSERT INTO betslip_has_matches ' +
                            '(betslip_id, match_id, home, away, tournament_name, country, start_time) ' +
                            'VALUES (?,?,?,?,?,?,?)';
                        client.execute(betslip_matches_query,
                            [betslip_id, found_match.match_id, found_match.home, found_match.away, found_match.tournament_name, found_match.country, found_match.start_time], {
                                prepare: true
                            }, function (err, res) {
                                if (err) {
                                    log.error && log.error('BetslipResponder.createBetslip', 'Failed to add matches to betslip', data, err);
                                }
                                var match_in_betslips_query = 'INSERT INTO match_in_betslips ' +
                                    '(match_id, betslip_id) ' +
                                    'VALUES (?,?)';
                                client.execute(match_in_betslips_query, [found_match.match_id, betslip_id], {
                                    prepare: true
                                }, function (err, res) {
                                    if (err) {
                                        log.error && log.error('BetslipResponder.createBetslip', 'Failed to add betslip to match', data, err);
                                    }
                                    var prediction_query = "SELECT type_text FROM prediction WHERE type = ?";
                                    var user_prediction_query = 'INSERT INTO match_has_user_predictions ' +
                                        '(match_id, user_id, type, type_text, prediction, betslip_id) ' +
                                        'VALUES (?,?,?,?,?,?)';
                                    client.execute(prediction_query, [prediction.type], {
                                        prepare: true
                                    }, function (err, res) {
                                        if (err) {
                                            log.error && log.error('BetslipResponder.createBetslip', 'Failed to find prediction type', data, err);
                                        }
                                        var type_text = res.rows.length === 0 ? '' : res.rows[0].type_text;
                                        client.execute(user_prediction_query, [found_match.match_id, data.creator, prediction.type, type_text, prediction.prediction, betslip_id], {
                                            prepare: true
                                        }, function (err, res) {
                                            if (err) {
                                                log.error && log.error('BetslipResponder.createBetslip', 'Failed to save predictions for match', data, err);
                                            }
                                        });
                                    });
                                    cb();
                                });
                            });
                    });
                }, function (err) {
                    var betslip_query = 'INSERT INTO betslip ' +
                        '(betslip_id, bet_size, creator, created, status, start_time, betslip_type, price) ' +
                        'VALUES (?,?,?,?,?,?,?,?)';
                    client.execute(betslip_query, [betslip_id, data.bet_size, data.creator, now, 'open', start_time, data.betslip_type, data.price], {
                        prepare: true
                    }, function (err, res) {
                        if (err) {
                            log.error && log.error('BetslipResponder.createBetslip', 'Failed to save betslip', data, err);
                            return callback(err);
                        }
                        var participates_query = "iNSERT INTO betslip_participants (betslip_id, user_id) VALUES (?,?)";
                        client.execute(participates_query, [betslip_id, data.creator], {
                            prepare: true
                        }, function (err, res) {
                            if (err) {
                                log.error && log.error('BetslipResponder.createBetslip', 'Failed to add user as participants', data, err);
                                return callback(err);
                            }
                            var potsize_query = 'UPDATE potsize_counter SET counter_value = counter_value + ' + data.bet_size +
                                ' WHERE betslip_id = ? ';
                            client.execute(potsize_query, [betslip_id], {
                                prepare: true
                            }, function (err, res) {
                                if (err) {
                                    log.error && log.error('BetslipResponder.createBetslip', 'Failed to update pot_size counter', data, err);
                                    return callback(err);
                                }
                                var wallet_query = 'UPDATE money_counter SET counter_value = counter_value - ' + data.bet_size +
                                    ' WHERE user_id = ? ';
                                client.execute(wallet_query, [data.creator], {
                                    prepare: true
                                }, function (err, res) {
                                    if (err) {
                                        log.error && log.error('BetslipResponder.createBetslip', 'Failed to update user money_size counter', data, err);
                                        return callback(err);
                                    }
                                    var get_wallet_query = 'select counter_value from money_counter where user_id = ?';
                                    client.execute(get_wallet_query, [data.creator], {
                                        prepare: true
                                    }, function (err, res) {
                                        if (err) {
                                            log.error && log.error('BetslipResponder.createBetslip', 'Failed to get wallet for user', data, err);
                                            return callback(err);
                                        }
                                        var wallet_size = res.rows[0].counter_value;
                                        if ((wallet_size < data.bet_size) && data.creator !== '11111111-1111-1111-1111-111111111111') {
                                            log.debug && log.debug('BetslipResponder.create', 'Rejecting request with insufficient funds', data);
                                            return callback(null, {
                                                status: 401,
                                                errorMsg: 'Rejecting request with insufficient funds'
                                            });
                                        }
                                        else {
                                            betslipController.insertTransaction(data.creator, betslip_id, data.bet_size, function (err, res) {
                                                if (err) {
                                                    log.error && log.error('BetslipResponder.createBetslip', 'Failed to update user transaction history', data, err);
                                                    return callback(err);
                                                }
                                                var user_query = 'SELECT * FROM user WHERE user_id = ?';
                                                client.execute(user_query, [data.creator], {
                                                    prepare: true
                                                }, function (err, res) {
                                                    if (err) {
                                                        log.error && log.error('BetslipResponder.createBetslip', 'Failed to add creator as participants', data, err);
                                                        return callback(err);
                                                    }
                                                    var user_name = res.rows.length === 0 ? '' : res.rows[0].first_name + ' ' + res.rows[0].last_name;
                                                    var participates_query = 'INSERT INTO user_participates_in_betslip ' +
                                                        '(user_id, betslip_id, betslip_name, joined) ' +
                                                        'VALUES (?,?,?,?)';
                                                    client.execute(participates_query, [data.creator, betslip_id, user_name, new Date()], {
                                                        prepare: true
                                                    }, function (err, res) {
                                                        if (err) {
                                                            log.error && log.error('BetslipResponder.createBetslip', 'Failed to add creator as participants', data, err);
                                                            return callback(err);
                                                        }
                                                        var invited_to__query = 'INSERT INTO user_invited_to_betslip ' +
                                                            '(user_id, betslip_id, betslip_name, invited_by) ' +
                                                            'VALUES (?,?,?,?)';
                                                        if (data.betslip_type === 'user') {
                                                            async.each(data.invitations, function (invitation, cb) {
                                                                client.execute(invited_to__query, [invitation, betslip_id, user_name, data.creator], {
                                                                    prepare: true
                                                                }, function (err, res) {
                                                                    if (err) {
                                                                        log.error && log.error('BetslipResponder.createBetslip', 'Failed to persist invited users', data, err);
                                                                        return callback(err);
                                                                    }
                                                                    // TODO Send notifications
                                                                    cb();
                                                                });
                                                            });
                                                        }
                                                        else {
                                                            var user_query = 'SELECT * FROM user;';
                                                            client.execute(user_query, [], {
                                                                prepare: true
                                                            }, function (err, res) {
                                                                if (err) {
                                                                    log.error && log.error('BetslipResponder.createBetslip', 'Failed to get users', data, err);
                                                                    return callback(err);
                                                                }
                                                                async.each(res.rows, function (user, cb) {
                                                                    if (user.deleted || user.exclusion) {
                                                                        cb();
                                                                    }
                                                                    else {
                                                                        var user_name = res.rows.length === 0 ? '' : user.first_name + ' ' + res.rows[0].last_name;
                                                                        client.execute(invited_to__query, [user.user_id, betslip_id, user_name, data.creator], {
                                                                            prepare: true
                                                                        }, function (err, res1) {
                                                                            if (err) {
                                                                                log.error && log.error('BetslipResponder.createBetslip', 'Failed to persist invited users', data, err);
                                                                                return callback(err);
                                                                            }
                                                                            // TODO Send notifications
                                                                            cb();
                                                                        });
                                                                    }
                                                                });
                                                            });
                                                        }


                                                        callback(null, {
                                                            status: 201,
                                                            data: {betslip_id: betslip_id, wallet_amount: wallet_size}
                                                        });
                                                    });
                                                });
                                            });
                                        }
                                    });
                                });
                            });
                        });
                    });
                }
            );
        }

    };

    this.fetchBetslips = function (ws, data, callback) {
        // Fetch only Kiggit betslips
        var kiggits = [];
        if (!data.user_id) {
            betslipController.getActiveKiggitBetslips(function (err, betslips) {
                async.forEach(betslips, function (betslip, cb) {
                    betslipController.getPotSize(betslip.betslip_id, function (err, res) {
                        if (err) {
                            log.debug && log.debug('BetslipResponder.;', 'Failed to get potsize for betslip', data);
                        }
                        betslip.pot_size = res;

                        betslipController.getParticipantsCount(betslip.betslip_id, function (err, res) {
                            if (err) {
                                log.debug && log.debug('BetslipResponder.;', 'Failed to get participants count for betslip', data);
                            }
                            betslip.participants = res;
                            kiggits.push(betslip);

                            cb();
                        });
                    });
                }, function (err) {
                    return callback(null, {status: 200, data: { betslips: kiggits}});
                });
            });
        }
        else {
            // If user is not logged in we only return Kiggit betslips
            var logged_in = true;
            if (ws.client === undefined && config.kiggit.environment !== 'development') {
                logged_in = false;
            }


            // Get all betslips a user participates in ( created / joined )
            var active = [], awaiting = [], closed = [];

            var participates_to_betslips = "SELECT * FROM user_participates_in_betslip WHERE user_id = ?";
            client.execute(participates_to_betslips, [data.user_id],
                {prepare: true},
                function (err, participates_in_betslips) {
                    if (err) {
                        log.error && log.error('BetslipResponder.fetchBetslipa', 'Failed to get betslips which user participates in', data, err);
                        return callback(null, []);
                    }
                    betslipController.getActiveBetslips(participates_in_betslips.rows, function (err, res) {
                        if (err) {
                            log.debug && log.debug('BetslipResponder.;', 'Failed to get active betslips', data);
                            return callback(null, []);
                        }

                        async.forEach(res, function (betslip, cb) {
                            if (logged_in) {
                                betslipController.getPotSize(betslip.betslip_id, function (err, res) {
                                    if (err) {
                                        log.debug && log.debug('BetslipResponder.;', 'Failed to get potsize for betslip', data);
                                    }
                                    betslip.pot_size = res;

                                    betslipController.getParticipantsCount(betslip.betslip_id, function (err, res) {
                                        if (err) {
                                            log.debug && log.debug('BetslipResponder.;', 'Failed to get participants count for betslip', data);
                                        }
                                        betslip.participants = res;
                                        active.push(betslip);

                                        cb();
                                    });
                                });
                            }
                            else {
                                if (betslip.betslip_type === 'kiggit') {
                                    betslipController.getPotSize(betslip.betslip_id, function (err, res) {
                                        if (err) {
                                            log.debug && log.debug('BetslipResponder.;', 'Failed to get potsize for betslip', data);
                                        }
                                        betslip.pot_size = res;

                                        betslipController.getParticipantsCount(betslip.betslip_id, function (err, res) {
                                            if (err) {
                                                log.debug && log.debug('BetslipResponder.;', 'Failed to get participants count for betslip', data);
                                            }
                                            betslip.participants = res;
                                            active.push(betslip);

                                            cb();
                                        });
                                    });
                                }
                                else {
                                    cb();
                                }
                            }
                        }, function (err) {
                            betslipController.getAwaitingBetslips(data.user_id, function (err, res) {
                                if (err || !res) {
                                    return callback(null, {
                                        status: 200,
                                        data: {awaiting: [], active: active, closed: []}
                                    });
                                }
                                async.each(res, function (betslip, cb1) {
                                    if (logged_in) {
                                        betslipController.getPotSize(betslip.betslip_id, function (err, res) {
                                            betslip.pot_size = res;

                                            betslipController.getParticipantsCount(betslip.betslip_id, function (err, res) {
                                                betslip.participants = res;

                                                awaiting.push(betslip);
                                                cb1();
                                            });
                                        });
                                    }
                                    else {
                                        if (betslip.betslip_type === 'kiggit') {
                                            betslipController.getPotSize(betslip.betslip_id, function (err, res) {
                                                betslip.pot_size = res;

                                                betslipController.getParticipantsCount(betslip.betslip_id, function (err, res) {
                                                    betslip.participants = res;

                                                    awaiting.push(betslip);
                                                    cb1();
                                                });
                                            });
                                        }
                                        else {
                                            cb1();
                                        }
                                    }

                                }, function (err) {
                                    betslipController.getclosedBetslips(participates_in_betslips.rows, function (err, res) {
                                        if (err || !res) {
                                            return callback(null, {
                                                status: 200,
                                                data: {awaiting: awaiting, active: active, closed: []}
                                            });
                                        }
                                        async.each(res, function (betslip, cb2) {
                                            if (logged_in) {
                                                betslipController.getPotSize(betslip.betslip_id, function (err, res) {
                                                    betslip.pot_size = res;

                                                    betslipController.getParticipantsCount(betslip.betslip_id, function (err, res) {
                                                        betslip.participants = res;

                                                        closed.push(betslip);
                                                        cb2();
                                                    });
                                                });
                                            }
                                            else {
                                                if (betslip.betslip_type === 'kiggit') {
                                                    betslipController.getPotSize(betslip.betslip_id, function (err, res) {
                                                        betslip.pot_size = res;

                                                        betslipController.getParticipantsCount(betslip.betslip_id, function (err, res) {
                                                            betslip.participants = res;

                                                            closed.push(betslip);
                                                            cb2();
                                                        });
                                                    });
                                                }
                                                else {
                                                    cb2();
                                                }
                                            }

                                        }, function (err) {
                                            if (err || !res) {
                                                return callback(null, {
                                                    status: 200,
                                                    data: {awaiting: awaiting, active: active, closed: []}
                                                });
                                            }
                                            callback(null, {
                                                status: 200,
                                                data: {awaiting: awaiting, active: active, closed: closed}
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
        }
    };

    this.fetchBetslipDetail = function (ws, data, callback) {
        if (!data.betslip_id) {
            log.debug && log.debug('BetslipResponder.fetchBetslipDetail', 'Rejecting request with insufficient or bad data', data);
            return callback(null, {
                status: 400,
                errorMsg: 'Rejecting request with insufficient or bad data',
                requiredFields: ['betslip_id']
            });
        }

        var response = {}, predictions = {}, outcomes = [], results = [], goalscorers = [];

        response.betslip_id = data.betslip_id;
        betslipController.getBetslip(data.betslip_id, function (err, res) {
            if (err) {
                log.error(err.toString());
            }
            if (res.rows.length === 0) {
                log.error && log.error('BetslipResponder.fetchBetslipDetail', 'No betslip found', data, err);
                return callback(null, {status: 404, errorMsg: 'No betslip found'});
            }
            var betslip = res.rows[0];
            response.bet_size = betslip.bet_size;
            response.start_time = betslip.start_time;

            betslipController.getPotSize(betslip.betslip_id, function (err, potsize) {
                if (err) {
                    log.debug && log.debug('BetslipResponder.;', 'Failed to get potsize for betslip', data);
                }
                response.pot_size = potsize;

                userController.getByUserId(betslip.creator, function (err, res1) {
                    if (err) {
                        log.error(err.toString());
                    }
                    if (res1.rows.length === 0) {
                        log.error && log.error('BetslipResponder.fetchBetslipDetail', 'User not found', data, err);
                        return callback(null, {status: 404, errorMsg: 'User not found'});
                    }
                    var user = res1.rows[0];
                    if (user.deleted) {
                    } else {
                        delete user.password;
                        delete user.updated;
                        delete user.created;
                        delete user.security_number;
                        response.creator = user;
                    }
                    betslipController.getParticipants(betslip.betslip_id, betslip.status, function (err, participants) {
                        if (err) {
                            response.participants = [];
                        }
                        else {
                            response.participants = participants;
                        }
                        var matches_query = "SELECT * FROM betslip_has_matches WHERE betslip_id = ?";
                        client.execute(matches_query, [betslip.betslip_id],
                            {prepare: true},
                            function (err, res2) {
                                if (err) {
                                    log.error(err.toString());
                                    return callback(err);
                                }
                                async.each(res2.rows, function (_match, cb) {

                                    var matches_query = "SELECT * FROM match_has_user_predictions WHERE match_id = ? AND user_id = ? AND betslip_id = ?";
                                    client.execute(matches_query, [_match.match_id, data.user_id, data.betslip_id],
                                        {prepare: true},
                                        function (err, res3) {
                                            if (err) {
                                                log.error(err.toString());
                                                return callback(err);
                                            }
                                            // If there are no predictions the user is invited to the betslip
                                            if (res3.rows.length === 0) {
                                                var obj = {};
                                                obj.match_id = _match.match_id;
                                                obj.home = _match.home;
                                                obj.away = _match.away;
                                                obj.country = _match.country;
                                                obj.start_time = _match.start_time;
                                                obj.tournament_name = _match.tournament_name;
                                                client.execute(matches_query, [_match.match_id, betslip.creator, betslip.betslip_id],
                                                    {prepare: true},
                                                    function (err, res3) {
                                                        if (err) {
                                                            log.error(err.toString());
                                                            return callback(err);
                                                        }
                                                        async.each(res3.rows, function (prediction, cb1) {
                                                            obj.type = prediction.type;
                                                            obj.type_text = prediction.type_text;
                                                            if (prediction.type === 1) {
                                                                results.push(obj);
                                                            }
                                                            else if (prediction.type === 2) {
                                                                outcomes.push(obj);
                                                            }
                                                            else {
                                                                goalscorers.push(obj);
                                                            }
                                                            cb1();
                                                        }, function (err) {
                                                            cb();
                                                        });
                                                    });
                                            }
                                            else {
                                                async.each(res3.rows, function (prediction, cb1) {
                                                    var obj = {};
                                                    obj.match_id = _match.match_id;
                                                    obj.home = _match.home;
                                                    obj.away = _match.away;
                                                    obj.country = _match.country;
                                                    obj.start_time = _match.start_time;
                                                    obj.tournament_name = _match.tournament_name;
                                                    obj.type = prediction.type;
                                                    obj.type_text = prediction.type_text;
                                                    obj.prediction = prediction.prediction;

//                                                    if (betslip.status === 'resolved') {
                                                    matchController.getMatchResult(_match.match_id, function (err, result) {
                                                        if (err || !result || result.length === 0) {
                                                            log.error && log.error('BetslipResponder.fetchBetslipDetail', 'Failed to find participants', data, err);
                                                            if (prediction.type === 1) {
                                                                results.push(obj);
                                                            }
                                                            else if (prediction.type === 2) {
                                                                outcomes.push(obj);
                                                            }
                                                            else {
                                                                goalscorers.push(obj);
                                                            }
                                                            cb1();
                                                        }
                                                        else {
                                                            log.debug('Found match result');
                                                            var _match_result = result[0];
                                                            if (obj.type === 1) {
                                                                var actual_result = _match_result.goals_away + '-' + _match_result.goals_home;
                                                                obj.real_result = actual_result;

                                                                if (actual_result === obj.prediction) {
                                                                    obj.hit = true;
                                                                }
                                                                else {
                                                                    obj.hit = false;
                                                                }
                                                            }
                                                            else {
                                                                var match_outcome;
                                                                if (_match_result.goals_away === _match_result.goals_home) {
                                                                    match_outcome = 'X';
                                                                } else if (_match_result.goals_away > _match_result.goals_home) {
                                                                    match_outcome = '1';
                                                                }
                                                                else {
                                                                    match_outcome = '2';
                                                                }
                                                                obj.real_result = match_outcome;
                                                                if (obj.prediction === match_outcome) {
                                                                    obj.hit = true;
                                                                }
                                                                else {
                                                                    obj.hit = false;
                                                                }

                                                            }
                                                            if (prediction.type === 1) {
                                                                results.push(obj);
                                                            }
                                                            else if (prediction.type === 2) {
                                                                outcomes.push(obj);
                                                            }
                                                            else {
                                                                goalscorers.push(obj);
                                                            }
                                                            cb1();
                                                        }
                                                    });
                                                    /*}
                                                     else {
                                                     if (prediction.type === 1) {
                                                     results.push(obj);
                                                     }
                                                     else if (prediction.type === 2) {
                                                     outcomes.push(obj);
                                                     }
                                                     else {
                                                     goalscorers.push(obj);
                                                     }
                                                     cb1();
                                                     }*/
                                                }, function (err) {
                                                    cb();
                                                });
                                            }
                                        });
                                }, function (err) {
                                    if (err) {
                                        log.error(err.toString());
                                        return callback(err);
                                    }
                                    predictions.outcomes = outcomes;
                                    predictions.results = results;
                                    predictions.goalscorers = goalscorers;
                                    response.predictions = predictions;
                                    callback(null, {status: 200, data: response});
                                });
                            });

                    });
                });
            });

        });
    };

    this.join = function (ws, data, callback) {
        if (!data.user_id || !data.betslip_id) {
            log.debug && log.debug('BetslipResponder.joinBetslip', 'Rejecting request with insufficient or bad data', data);
            return callback(null, {
                status: 400,
                errorMsg: 'Rejecting request with insufficient or bad data',
                requiredFields: ['user_id', 'betslip_id']
            });
        }
        betslipController.getBetslip(data.betslip_id, function (err, res1) {
                if (err) {
                    log.error && log.error('BetslipResponder.joinBetslip', 'Failed to retrieve betslip', data, err);
                    return callback(null, {status: 500, errorMsg: 'Failed to retrieve betslip'});
                }
                if (res1.rows.length === 0) {
                    log.error && log.error('BetslipResponder.joinBetslip', 'No betslip found', data, err);
                    return callback(null, {status: 404, errorMsg: 'No betslip found'});
                }

                var betslip = res1.rows[0];
                if (betslip.start_time < new Date()) {
                    log.error && log.error('BetslipResponder.joinBetslip', 'Betslip already started - cannot be joined', data, err);
                    return callback(null, {status: 403, errorMsg: 'Betslip already started - cannot be joined'});
                }

                var bet_size = betslip.bet_size;
                walletController.validateFunds(data.user_id, bet_size, function (err, valid) {
                    if (!valid) {
                        log.debug && log.debug('BetslipResponder.joinBetslip', 'Rejecting request with insufficient funds', data);
                        return callback(null, {
                            status: 401,
                            errorMsg: 'Rejecting request with insufficient funds'
                        });
                    }
                    else {
                        var potsize_query = 'UPDATE potsize_counter SET counter_value = counter_value + ' + bet_size +
                            ' WHERE betslip_id = ? ';

                        client.execute(potsize_query, [data.betslip_id], {
                            prepare: true
                        }, function (err, res) {
                            if (err) {
                                log.error && log.error('BetslipResponder.joinBetslip', 'Failed to update pot_size counter', data, err);
                                return callback(err);
                            }
                            var money_query = 'UPDATE money_counter SET counter_value = counter_value - ' + bet_size +
                                ' WHERE user_id = ? ';
                            client.execute(money_query, [data.user_id], {
                                prepare: true
                            }, function (err, res) {
                                if (err) {
                                    log.error && log.error('BetslipResponder.joinBetslip', 'Failed to update user money_size counter', data, err);
                                    return callback(err);
                                }
                                betslipController.insertTransaction(data.user_id, data.betslip_id, bet_size * -1, function (err, res) {
                                    if (err) {
                                        log.error && log.error('BetslipResponder.createBetslip', 'Failed to update user transaction history', data, err);
                                        return callback(err);
                                    }

                                    userController.getInvitation(data.user_id, data.betslip_id, function (err, res) {
                                        if (err || !res) {
                                            log.debug && log.debug('BetslipResponder.joinBetslip', 'Failed to retrieve invitation', data);
                                            return callback(null, {status: 500});
                                        }
                                        if (res.rows.length === 0) {
                                            log.debug && log.debug('BetslipResponder.joinBetslip', 'No invitation found', data);
                                            return callback(null, {status: 404, errorMsg: 'No invitation found'});
                                        }
                                        var participates_query = "iNSERT INTO betslip_participants (betslip_id, user_id) VALUES (?,?)";
                                        client.execute(participates_query, [data.betslip_id, data.user_id], {
                                            prepare: true
                                        }, function (err, res) {
                                            if (err) {
                                                log.error && log.error('BetslipResponder.joinBetslip', 'Failed to add user as participants', data, err);
                                                return callback(err);
                                            }

                                            var user_query = 'SELECT * FROM user WHERE user_id = ?';
                                            client.execute(user_query, [data.user_id], {
                                                prepare: true
                                            }, function (err, res) {
                                                if (err) {
                                                    log.error && log.error('BetslipResponder.createBetslip', 'Failed to add creator as participants', data, err);
                                                    return callback(err);
                                                }

                                                var user_name = res.rows.length === 0 ? '' : res.rows[0].first_name + ' ' + res.rows[0].last_name;
                                                var participates_query = 'INSERT INTO user_participates_in_betslip ' +
                                                    '(user_id, betslip_id, betslip_name, joined) ' +
                                                    'VALUES (?,?,?,?)';
                                                client.execute(participates_query, [data.user_id, data.betslip_id, user_name, new Date()], {
                                                    prepare: true
                                                }, function (err, res) {
                                                    if (err) {
                                                        log.error && log.error('BetslipResponder.createBetslip', 'Failed to add creator as participants', data, err);
                                                        return callback(err);
                                                    }

                                                    var delete_invite_query = "DELETE FROM user_invited_to_betslip WHERE user_id = ? AND betslip_id = ? ";
                                                    client.execute(delete_invite_query, [data.user_id, data.betslip_id], {
                                                        prepare: true
                                                    }, function (err, res) {
                                                        if (err) {
                                                            log.error && log.error('BetslipResponder.joinBetslip', 'Failed to delete user invite', data, err);
                                                            return callback(err);
                                                        }
                                                        async.each(data.predictions, function (prediction, cb) {
                                                            log.debug(prediction);

                                                            var get_match_query = 'SELECT * FROM match WHERE match_id = ?';
                                                            client.execute(get_match_query, [prediction.match_id], {
                                                                prepare: true
                                                            }, function (err, res) {
                                                                if (err) {
                                                                    log.error && log.error('BetslipResponder.joinBetslip', 'Failed to get match in betslip', data, err);
                                                                }

                                                                var found_match = res.rows[0];

                                                                var prediction_query = "SELECT type_text FROM prediction WHERE type = ?";
                                                                var user_prediction_query = 'INSERT INTO match_has_user_predictions ' +
                                                                    '(match_id, user_id, type, type_text, prediction, betslip_id) ' +
                                                                    'VALUES (?,?,?,?,?,?)';
                                                                client.execute(prediction_query, [prediction.type], {
                                                                    prepare: true
                                                                }, function (err, res) {
                                                                    if (err) {
                                                                        log.error && log.error('BetslipResponder.joinBetslip', 'Failed to find prediction type', data, err);
                                                                    }
                                                                    var type_text = res.rows.length === 0 ? '' : res.rows[0].type_text;
                                                                    client.execute(user_prediction_query, [found_match.match_id, data.user_id, prediction.type, type_text, prediction.prediction, data.betslip_id], {
                                                                        prepare: true
                                                                    }, function (err, res) {
                                                                        if (err) {
                                                                            log.error && log.error('BetslipResponder.joinBetslip', 'Failed to save predictions for match', data, err);
                                                                        }
                                                                        cb();
                                                                    });
                                                                });
                                                            });
                                                        }, function (err) {
                                                            callback(null, {status: 202, data: {}});
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    }

                });
            }
        )
        ;


    }
    ;

    this.invite = function (ws, data, callback) {
        if (!data.betslip_id) {
            log.debug && log.debug('BetslipResponder.invite', 'Rejecting request with insufficient or bad data', data);
            return callback(null, {
                status: 400,
                errorMsg: 'Rejecting request with insufficient or bad data',
                requiredFields: ['betslip_id']
            });
        }
        betslipController.getBetslip(data.betslip_id, function (err, res) {
            if (err) {
                log.error(err.toString());
                return callback(err);
            }
            if (!res || res.rows.length === 0) {
                log.debug && log.debug('BetslipResponder.inviteToBetslip', 'Betslip not found', data);
                return callback(null, {status: 404, errorMsg: "Betslip not found"});
            }
            var betslip = res.rows[0];
            userController.getByUserId(betslip.creator, function (err, res1) {
                if (!res1 || res1.rows.length === 0) {
                    log.debug && log.debug('BetslipResponder.inviteToBetslip', 'Inviting user not found', data);
                    return callback(null, {status: 404, errorMsg: "Inviting user not found"});
                }
                var creator = res1.rows[0];
                var invited_to__query = 'INSERT INTO user_invited_to_betslip ' +
                    '(user_id, betslip_id, betslip_name, invited_by) ' +
                    'VALUES (?,?,?,?)';
                async.each(data.invitations, function (invitation, cb) {
                    client.execute(invited_to__query, [invitation, data.betslip_id, creator.creator_name, betslip.creator], {
                        prepare: true
                    }, function (err, res) {
                        if (err) {
                            log.error && log.error('BetslipResponder.inviteToBetslip', 'Failed to persist invited users', data, err);
                            return callback(err);
                        }
                        // TODO Send notifications
                        cb();
                    });
                }, function (err) {
                    if (err) {
                        log.error(err.toString());
                        return callback(err);
                    }
                    return callback(null, {status: 202, data: {}});
                });
            });
        });
    };

    this.inviteable = function (ws, data, callback) {
        if (!data.betslip_id || !data.user_id) {
            log.debug && log.debug('BetslipResponder.invite', 'Rejecting request with insufficient or bad data', data);
            return callback(null, {
                status: 400,
                errorMsg: 'Rejecting request with insufficient or bad data',
                requiredFields: ['betslip_id', 'user_id']
            });
        }
        var query = "SELECT * FROM user_has_friends WHERE user_id = ?";
        client.execute(query, [data.user_id], {
            prepare: true
        }, function (err, friends) {
            if (err || !friends || !friends.rows || !friends.rows.length === 0) {
                log.error && log.error('BetslipResponder.inviteable', 'Found no friends', data, err);
                return callback(null, []);
            }
            var invitees = [];
            async.each(friends.rows, function (friend, cb) {
                var invited = "SELECT * FROM user_invited_to_betslip WHERE betslip_id = ? and user_id = ?";
                client.execute(invited, [data.betslip_id, friend.friend_id], {prepare: true},
                    function (err, res) {
                        // Not invited - might have joined
                        if (err || !res.rows || res.rows.length === 0) {
                            var invited = "SELECT * FROM user_participates_in_betslip WHERE user_id = ? and betslip_id = ?";
                            client.execute(invited, [friend.friend_id, data.betslip_id], {prepare: true},
                                function (err, res) {
                                    // Not joined - thus invitable
                                    if (err || !res.rows || res.rows.length === 0) {
                                        invitees.push(friend.friend_id);
                                        cb();
                                    }
                                    else {
                                        cb();
                                    }
                                });
                        }
                        else {
                            cb();
                        }
                    });
            }, function (err) {
                return callback(null, {status: 200, data: {friends: invitees}});
            });
        });
    };
}
util.inherits(BetslipResponder, events.EventEmitter);
module.exports = new BetslipResponder();