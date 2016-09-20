'use strict';
var util = require('util');
var upcomming_matches = require('../../model/upcomming_matches.js');
var matchModel = require('../../model/match.js');
var resultHandler = require('../handlers/resultHandler.js');
var async = require('async');
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
var schedulesandresult = function(data, cb) {
    var updated = data.$.generatedAt;
    for (Sport of data.Sport) {
        for (Category of Sport.Category) {
            var country = Category.$.name;
            for (Tournament of Category.Tournament) {
                var tournament_name = Tournament.$.name;
                var tournament_id = Tournament.$.id;
                if (tournamentsFilter.has(tournament_id)) {
                    for (Match of Tournament.Matches[0].Match) {
                        var match = {};
                        match.scheduled_start = Match.$.dateOfMatch;
                        match.scheduled_start_day = match.scheduled_start.substring(0, 10);
                        match.match_id = Match.$.id;
                        match.home = Match.Teams[0].Team[0].$.name;
                        match.away = Match.Teams[0].Team[1].$.name;
                        match.name = match.home + ' - ' + match.away;
                        match.country = country;
                        match.tournament_name = tournament_name;
                        match.tournament_id = tournament_id;
                        match.updated = updated;
                        upcomming_matches.updateMatch(match, function(err) {
                            if (err) {
                                console.error(err);
                                return cb(err, 'updateMatch');
                            }
                        });

                        matchModel.insertMatch(match, function(err) {
                            if (err) {
                                console.error(err);
                                return cb(err, 'insertMatch');
                            }
                        });
                        if (Match.Result !== undefined && Match.Result[0].$.canceled !== 'true') {
                            var hasFinalTime = false;
                            for (score of Match.Result[0].Score) {
                                if (score.$.type === 'FT') {
                                    var goals = score.$.value.split(':');
                                    console.log('goals_home = ' + goals[0] + ' goals_away ' + goals[1]);

                                    var result = {};
                                    result.match_id = match.match_id;
                                    result.goals_home = parseInt(goals[0]);
                                    result.goals_away = parseInt(goals[1]);
                                    result.canceled = Match.Result[0].$.canceled;
                                    result.postponed = Match.Result[0].$.postponed;
                                    result.updated = match.updated;

                                    resultHandler.handle(result, function(err) {
                                        if (err) {
                                            console.error(err);
                                            return cb(err, 'resultHandler');
                                        }
                                    })
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    cb();
};
module.exports = schedulesandresult;