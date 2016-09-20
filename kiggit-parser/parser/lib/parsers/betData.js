/*global config*/
'use strict';
var upcomming_matches = require('../../model/upcomming_matches.js');
var matchModel = require('../../model/match.js');
var resultHandler = require('../handlers/resultHandler.js');
var async = require('async');
//var util = require('util');
/*
 * Set containing tournaments id of interest
 */
var tournamentsFilter = new Set();
for (var tournament of config.kiggit.tournaments) {
    tournamentsFilter.add(tournament);
}

/*
 * Extract matches from the json object created from
 * the scheduleandresult feed.
 * $param data json object
 * $param cb callback
 */
var betData = function(data, cb) {
    var updated = data.Timestamp[0].$.CreatedTime;
    async.each(data.Sports[0].Sport, function(Sport, callback0) {
        async.each(Sport.Category, function(Category, callback1) {
            if (Category.Tournament !== undefined) {
                var country = Category.Texts[0].Text[0].Value[0];
                async.each(Category.Tournament, function(Tournament, callback1_5){
                    var tournament_name = Tournament.Texts[0].Text[0].Value[0];
                    var tournament_id = Tournament.$.BetradarTournamentID;
                    if (tournamentsFilter.has(tournament_id)) {
                        async.each(Tournament.Match, function(Match, callback2) {
                            var match = {};
                            var result = {};
                            match.match_id = Match.$.BetradarMatchID;
                            match.scheduled_start = Match.Fixture[0].DateInfo[0].MatchDate[0];
                            match.scheduled_start_day = match.scheduled_start.substring(0, 10);
                            match.home = Match.Fixture[0].Competitors[0].Texts[0].Text[0].Text[0].Value[0];
                            match.away = Match.Fixture[0].Competitors[0].Texts[1].Text[0].Text[0].Value[0];
                            match.name = match.home + ' - ' + match.away;
                            match.country = country;
                            match.tournament_name = tournament_name;
                            match.tournament_id = tournament_id;
                            match.updated = updated;
                            var matchResult = false;

                            if (Match.Result !== undefined &&
                                Match.Result[0] !== undefined &&
                                Match.Result[0].ScoreInfo !== undefined &&
                                Match.Result[0].ScoreInfo[0] !== undefined &&
                                Match.Result[0].ScoreInfo[0].Score !== undefined) {
                                for (var score of Match.Result[0].ScoreInfo[0].Score) {
                                    if (score.$.Type === 'FT') {
                                        var goals = score._.split(':');
                                        result.match_id = match.match_id;
                                        result.goals_home = parseInt(goals[0]);
                                        result.goals_away = parseInt(goals[1]);
                                        if (result.goals_away < result.goals_home) {
                                            result.result = "1";
                                        } else if (result.goals_away == result.goals_home) {
                                            result.result = "x";
                                        } else if (result.goals_away > result.goals_home) {
                                            result.result = "2";
                                        }
                                        if (Match.Result[0].$ !== undefined &&
                                            Match.Result[0].$.canceled !== undefined) {
                                            result.canceled = "true";
                                        } else {
                                            result.canceled = "false";
                                        }
                                        if (Match.Result[0].$ !== undefined) {
                                            result.canceled = "true";
                                        }
                                        if (Match.Result[0].$ !== undefined &&
                                            Match.Result[0].$.postponed !== undefined) {
                                            result.postponed = "true";
                                        } else {
                                            result.postponed = "false";
                                        }
                                        matchResult = true;
                                    }
                                }
                            }
                            async.series([
                                function(callback) {
                                    upcomming_matches.updateMatch(match, function(err) {
                                        if (err) {
                                            callback(err, 'one');
                                        } else {
                                            callback(null, 'one');
                                        }
                                    });
                                },
                                function(callback) {
                                    matchModel.insertMatch(match, function(err) {
                                        if (err) {
                                            callback(err, 'Two');
                                        } else {
                                            callback(null, 'Two');
                                        }
                                    });
                                },
                                function(callback) {
                                    if (matchResult) {
                                        resultHandler.handle(result, function(err) {
                                            if (err) {
                                                callback(err, 'Three');
                                            } else {
                                                callback(null, 'Three');
                                            }
                                        });
                                    } else {
                                        callback(null, "Three");
                                    }
                                }
                            ],
                            function(err, results) {
                                if (err) {
                                    callback2(err);
                                } else {
                                    callback2();
                                }
                            });
                        }, function(err) {
                            if (err) {
                                callback1_5(err);
                            } else {
                                callback1_5();
                            }
                        });
                    } else {
                        callback1_5();
                    }
                }, function () {
                    callback1();
                });
            } else {
                //Arriving here means its an outright and not a tournament. 
                //note from Betradar:
                //Matches belong to tournaments, outrights to categories.
                //Outright bet is a bet placed on the outcome of an entire
                //league or competition rather than on an individual game. )
                callback1();                
            }
        }, function(err){
            if (err) {
                callback0(err);
            } else {
                callback0();
            }
        });
    }, function(err){
        if (err) {
            cb(err);
        } else {
            cb();
        }
    });
};
module.exports = betData;
