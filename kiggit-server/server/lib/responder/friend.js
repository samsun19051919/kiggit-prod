'use strict';

var self;
var tools      = require('../tools');
var log        = tools.logger;
var async = require('async');
var util = require('util');
var events = require('events');

var friendController = require('../controller/friend');

function FriendsResponder() {
    self = this;

    this.getUserIdsFromFacebookIds = function (ws, data, callback) {
        if (!data.facebook_ids) {
            log.debug && log.debug('friend.getUserIdsFromFacebookIds', 'Rejecting request with insufficient or bad data', data);
            return callback(null, {
                status: 400,
                errorMsg: 'Rejecting request with insufficient or bad data',
                requiredFields: ['facebook_ids']
            });
        }
        var friends = [];
        async.each(data.facebook_ids, function (fbid, cb) {
            var friend = {};
            friend.facebook_id = fbid;
            friend.user_id = null;
            friend.name = null;
            friendController.getUserIdFromFacebookId(fbid, function (err, res) {
                if (res.length === 0) {
                    friends.push(friend);
                    cb();
                }
                else {
                    delete friend.user_id;
                    delete friend.name;
                    friend.user_id = res[0].user_id;
                    friend.name = res[0].first_name + ' ' + res[0].last_name;
                    friends.push(friend);
                    cb();
                }

            });

        }, function (err) {
            if (err) {
                log.error(err.toString());
                return callback(err);
            }
            callback(null, {status: 200, data: {friends: friends}});
        });

    };



};


util.inherits(FriendsResponder, events.EventEmitter);
module.exports = new FriendsResponder();