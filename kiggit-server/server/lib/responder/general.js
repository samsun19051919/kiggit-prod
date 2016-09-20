'use strict';

var util = require('util');
var events = require('events');
var self;
var userController = require('../controller/user');
var async = require('async');
var Logger = require('../../util/Logger');
var generalController = require('../controller/general');
var betslipController = require('../controller/betslip');


/*

 var client = require('../database/dbClient').init();

 var bcrypt = require('bcrypt');

 var uuid = require("node-uuid");
 var USER_SEARCH_PREFIX_CHARS = 3;
 var facebookController = require('../facebook');
 var friendController = require('../controller/friend');
 var validator = require("email-validator");
 */
function GeneralResponder() {
    self = this;

    this.leaderboard = function (ws, data, callback) {
        if (!data.user_id) {
            log.debug && log.debug('general.leaderboard', 'Rejecting request with insufficient or bad data', data);
            return callback(null, {
                status: 400,
                errorMsg: 'Rejecting request with insufficient or bad data',
                requiredFields: ['user_id']
            });
        }

        userController.getFriends(data.user_id, function (err, friends) {
            if (err || !friends) {
                return callback(null, {
                    status: 500,
                    errorMsg: 'Failed to get friends for user - try again'
                });
            }
            if (friends.length === 0) {
                return callback(null, {
                    status: 404,
                    errorMsg: 'No friends found'
                });
            }
            var friend_scores = [];
            // We need ourselves as well
            var friend = {user_id: data.user_id, friend_id: data.user_id};
            friends.push(friend);
            async.each(friends, function (friend, cb) {
                var friend_score = {};
                betslipController.getParticipatesCount(friend.friend_id, function (err, count) {
                    if (err) {
                        // Ignore
                        cb();
                    }
                    userController.getByUserId(friend.friend_id, function (err, user) {
                        if (err) {
                            // Ignore
                        }
                        var user1 = user.rows[0];
                        var name = user1.first_name + ' ' + user1.last_name;
                        friend_score.name = name;
                        friend_score.profile_pic_url = user1.profile_pic_url === undefined ? '' : user1.profile_pic_url;
                        friend_score.facebook_id = user1.facebook_id;
                        friend_score.score = count.score;

                        friend_scores.push(friend_score);
                        cb();
                    });


                });
            }, function (err) {
                return callback(null, {status: 200, data: {leaderboard: friend_scores.sort(compare)}});

            });
        });
    };

    function compare(a, b) {
        if (a.betslipcounter < b.betslipcounter)
            return 1;
        if (a.betslipcounter > b.betslipcounter)
            return -1;
        return 1;
    };
}
util.inherits(GeneralResponder, events.EventEmitter);
module.exports = new GeneralResponder();
