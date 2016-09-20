'use strict';

var self;
var tools      = require('../tools');
var log        = tools.logger;
var util = require('util');
var events = require('events');
var client = require('../database/dbClient').init();
var async = require('async');

function Controller() {
    self = this;

    this.getUserIdFromFacebookId = function(facebook_id, callback) {
        var query = 'SELECT user_id, first_name, last_name FROM user WHERE facebook_id = ?';
        client.execute(query, [facebook_id], {prepare: true},
            function (err, res) {
                if (err){
                    log.error(err.toString());
                    return callback(err);
                }
                callback(null, res.rows);
            });
    };

    this.addNewFriendsFromFacebookIds = function (user_id, fbFriends, callback) {
        var added_friends = [];
        async.each(fbFriends, function(fbFriend, cb) {
            var query = 'SELECT * FROM user_has_friends WHERE user_id = ? AND friend_id = ?';
            client.execute(query, [user_id, fbFriend.user_id], {prepare: true},
                function (err, res) {
                    if (err || res.rows.length > 0){
                        cb();
                    }
                    else {
                        // We are not friends add person
                        this.addFriend(user_id, fbFriend.user_id, function (err, res) {
                            var added_friend = {user_id: fbFriend.user_id, name: fbFriend.name};
                            added_friends.push(added_friend);
                            cb();
                        });
                    }
                });
        }, function (err) {
            if (err) {
                log.debug('asdsad');
            }
            return callback(null, added_friends);
        });
    };

    this.addFriend = function (user_id, friend_user_id, callback) {
        var query = 'INSERT INTO user_has_friends (user_id, friend_id, since) VALUES (?,?,?)';
        client.execute(query, [user_id, friend_user_id, new Date()], {prepare: true},
            function (err, res) {
                if (err){
                    log.error(err.toString());
                    return callback(err);
                }
                callback();

            });
    };

    this.getFriendById = function (user_id, friend_id, callback) {
        log.debug(user_id);
        log.debug(friend_id);
        var query = 'SELECT * FROM user_has_friends WHERE user_id = ? AND friend_id = ?';
        client.execute(query, [user_id, friend_id], {prepare: true},
            function (err, res) {
                if (err){
                    log.error(err.toString());
                    return callback(err);
                }
                else if (res.rows.length === 0) {
                    return callback(null, []);
                }
                else {
                    callback(null, res.rows[0]);
                }

            });
    };


};


util.inherits(Controller, events.EventEmitter);
module.exports = new Controller();