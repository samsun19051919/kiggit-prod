'use strict';
var betslip = require('../../model/betslip.js');
var match = require('../../model/match.js');
var results = require('../../model/results.js');
var util = require('util');
var async = require('async');
var child_process = require('child_process');

/*
 * Helper function which check if match does not have result.
 * True if there are no result for the match
 */
function notSettled(match, callback) {
    results.get(match.match_id.toString(), function(result) {
        if (result.rows.length === 0) {
            callback(true);
        } else {
            callback(false);
        }
    });
}
/*
 * Helper function which check if betslip have been resolved. 
 */
function hasBeenResolved(Betslip, callback) {
    betslip.getSettled(Betslip.betslip_id, function(result) {
        if (result.rows[0]) {
            callback(true);
        } else {
            callback(false);
        }
    });
}

/*
 * Check if all matches on betslip has results and setle if true
 */
function checkBetslips(match_id, cb) {
    match.getBetslips(match_id, function(betslips) {
        if (betslips.rows.length > 0) {
            async.each(betslips.rows, function(Betslip) {
                betslip.getMatches(Betslip.betslip_id, function(Matches) {
                    async.filter(Matches.rows, notSettled, function(NotSettledMatches) {
                            //has all matches been settled
                        if (NotSettledMatches.length === 0) {
                            betslip.getSettled(Betslip.betslip_id, function(result) {
                                if (result.rows.length === 0) {
                                    betslip.settle(Betslip.betslip_id, function(err) {
                                        if (err) {
                                            console.error(err);
                                            cb(err);
                                        } else {
                                            cb();
                                        }
                                    });
                                } else {
                                    cb();
                                }
                            });
                        } else {
                            cb();
                        }
                    });
                });

            });
        } else {
            cb();
        }
    });
}

function checkBetslipsResolved(match_result, cb) {
    match.getBetslips(match_result.match_id, function(betslips) {
        async.filter(betslips.rows, hasBeenResolved, function(resolvedBetslips) {
            for (var Betslip of resolvedBetslips) {
                console.error('Warning: An update to match result which has already' +
                    'been Resolved has been received and the following betslips' +
                    'has already been resolved\n' + util.inspect(Betslip, false, null) +
                    '\nThe new match result is \n' + util.inspect(match_result, false, null));
            }
            cb();
        });
    });
}

function handle(match_result, cb) {
    results.get(match_result.match_id, function(result) {
        if (result.rows.length > 0 &&
            (match_result.goals_home !== result.rows[0].goals_home ||
            match_result.goals_away !== result.rows[0].goals_away)) {
            checkBetslipsResolved(match_result, function() {
                results.insert(match_result, function(err) {
                    if (err) {
                        console.error(err);
                        cb(err);
                    } else {
                        checkBetslips(match_result.match_id, function() {
                            /**
                         * if a new result was updated all betslips_leaderboard which the result
                         * is part of is updated by starting the spark program spark-betslip-leaderboard
                         * 
                         */
                        console.log('running spark 1')
                        child_process.execFile('sudo', ['/root/kiggit/kiggit-parser/spark/spark-betslip-leaderboard/runBetslipLeaderboard.sh', config.kiggit.hosts, match_result.match_id], (error, stdout, stderr) => {
                            if (error) {
                                    console.log("error: from spark 1 when resolving match_result.match_id", match_result.match_id);
                                    throw error;
                                }
                                console.log(stdout);
                                    cb();
                            });
                        });
                    }
                });
            });
        } else {
            results.insert(match_result, function(err) {
                if (err) {
                    console.error(err);
                    return cb(err);
                } else {
                    checkBetslips(match_result.match_id, function() {
                        console.log('running spark 2')
                        child_process.execFile('sudo', ['/root/kiggit/kiggit-parser/spark/spark-betslip-leaderboard/runBetslipLeaderboard.sh', config.kiggit.hosts, match_result.match_id], [{uid: 'ubuntu'}],(error, stdout, stderr) => {
                            if (error) {
                                console.log("error: from spark 2 when resolving match_result.match_id", match_result.match_id);
                                throw error;
                            }
                            console.log(stdout);
                            cb();
                        });                     
                    });
                }
            });

        }
    });
}
module.exports.handle = handle;