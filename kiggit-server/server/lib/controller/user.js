/**
 * TODO: TBD: Using error domains would make sense for real errors on the cassandra
 * driver. Or, at least do checking on the health status of the driver after an error.
 */
'use strict';

var tools = require('../tools');
var log = tools.logger;
var async = require('async');
var client = require('../database/dbClient').init();
var generatePassword = require('password-generator');
var uuid = require("node-uuid");
var util = require('util');
var facebookController = require('../facebook');
var friendController = require('./friend');

function Controller() {
    var USER_SEARCH_PREFIX_CHARS = 3;
    var self = this;

    this.getByUserId = function (user_id, callback) {
        var query = 'SELECT * FROM user WHERE user_id = ?';
        client.execute(query, [user_id], {prepare: true},
            function (err, res) {
                if (err) {
                    log.error(err.toString());
                    return callback(err);
                }
                callback(null, res);

            });
    };


    this.getByEmail = function (email, callback) {
        var query = 'SELECT * FROM user WHERE email = ?';
        client.execute(query, [email], {prepare: true},
            function (err, res) {
                if (err) {
                    log.error(err.toString());
                    return callback(err);
                }
                callback(null, res);
            });
    };

    this.getWalletAmount = function (user_id, callback) {
        var query = 'SELECT counter_value FROM money_counter WHERE user_id = ?';
        client.execute(query, [user_id], {prepare: true},
            function (err, res) {
                if (err || res.rows.length === 0) {
                    return callback(null, 0);
                }
                return callback(null, parseInt(res.rows[0].counter_value));
            });
    };

    this.generatePassword = function (callback) {
        var newpasswd = generatePassword(8, false);

        callback(null, newpasswd);
    };

    this.updatePassword = function (user_id, password, callback) {
        var query = 'UPDATE user SET password = ? WHERE user_id = ?';
        client.execute(query, [password, user_id], {prepare: true},
            function (err, res) {
                if (err) {
                    log.error(err.toString());
                    return callback(err);
                }
                callback(null, res);
            });
    };

    this.setCode = function (user_id, pincode, callback) {
        var query = 'UPDATE user SET pin_code = ? WHERE user_id = ?';
        client.execute(query, [pincode, user_id], {prepare: true},
            function (err, res) {
                if (err) {
                    log.error(err.toString());
                    return callback(err);
                }
                callback(null, res);
            });
    };

    this.getFriends = function (user_id, callback) {
        var query = 'SELECT friend_id FROM user_has_friends WHERE user_id = ?';
        client.execute(query, [user_id], {prepare: true},
            function (err, res) {
                if (err) {
                    log.error(err.toString());
                    return callback(err);
                }
                callback(null, res.rows);
            });
    };

    this.getInvitation = function (user_id, betslip_id, callback) {
        var query = 'SELECT * FROM user_invited_to_betslip WHERE user_id = ? AND betslip_id = ?';
        client.execute(query, [user_id, betslip_id], {prepare: true},
            function (err, res) {
                if (err) {
                    log.error(err.toString());
                    return callback(err);
                }
                callback(null, res);
            });
    };

    this.update = function (data, callback) {
        var query = 'UPDATE user SET ';
        var cql_params = [];
        if (typeof(data.country) != "undefined") {
            if (cql_params.length > 0) {
                query = query + ',';
            }
            query = query + ' country = ? ';
            cql_params.push(data.country);
        }
        if (typeof(data.email) != "undefined") {
            if (cql_params.length > 0) {
                query = query + ',';
            }
            query = query + ' email = ? ';
            cql_params.push(data.email);
        }
        if (typeof(data.facebook_id) != "undefined") {
            if (cql_params.length > 0) {
                query = query + ',';
            }
            query = query + ' facebook_id = ?, ';
            cql_params.push(data.facebook_id);

            // Update profile picture url
            query = query + ' profile_pic_url = ? ';
            cql_params.push(util.format(config.kiggit.fb_pic_url, data.facebook_id));
        }
        if (typeof(data.first_name) != "undefined") {
            if (cql_params.length > 0) {
                query = query + ',';
            }
            query = query + ' first_name = ? ';
            cql_params.push(data.first_name);
        }
        if (typeof(data.last_name) != "undefined") {
            if (cql_params.length > 0) {
                query = query + ',';
            }
            query = query + ' last_name = ? ';
            cql_params.push(data.last_name);
        }
        if (typeof(data.gender) != "undefined") {
            if (cql_params.length > 0) {
                query = query + ',';
            }
            query = query + ' gender = ? ';
            cql_params.push(data.gender);
        }
        if (typeof(data.locale) != "undefined") {
            if (cql_params.length > 0) {
                query = query + ',';
            }
            query = query + ' locale = ? ';
            cql_params.push(data.locale);
        }
        if (typeof(data.device) != "undefined") {
            if (cql_params.length > 0) {
                query = query + ',';
            }
            query = query + ' device = ? ';
            cql_params.push(data.device);
        }
        if (typeof(data.fbAccessToken) != "undefined") {
            if (cql_params.length > 0) {
                query = query + ',';
            }
            query = query + ' fb_access_token = ? ';
            cql_params.push(data.fbAccessToken);
        }
        if (typeof(data.street_name) != "undefined") {
            if (cql_params.length > 0) {
                query = query + ',';
            }
            query = query + ' street_name = ? ';
            cql_params.push(data.street_name);
        }
        if (typeof(data.floor) != "undefined") {
            if (cql_params.length > 0) {
                query = query + ',';
            }
            query = query + ' floor = ? ';
            cql_params.push(data.floor);
        }
        if (typeof(data.street_number) != "undefined") {
            if (cql_params.length > 0) {
                query = query + ',';
            }
            query = query + ' street_number = ? ';
            cql_params.push(data.street_number);
        }
        if (typeof(data.city_name) != "undefined") {
            if (cql_params.length > 0) {
                query = query + ',';
            }
            query = query + ' city_name = ? ';
            cql_params.push(data.city_name);
        }
        if (typeof(data.area_code) != "undefined") {
            if (cql_params.length > 0) {
                query = query + ',';
            }
            query = query + ' area_code = ? ';
            cql_params.push(data.area_code);
        }
        if (typeof(data.county) != "undefined") {
            if (cql_params.length > 0) {
                query = query + ',';
            }
            query = query + ' county = ? ';
            cql_params.push(data.county);
        }
        if (typeof(data.contactViaSMS) != "undefined") {
            if (cql_params.length > 0) {
                query = query + ',';
            }
            query = query + ' contactViaSMS = ? ';
            cql_params.push(data.contactViaSMS);
        }
        if (typeof(data.contactViaEmail) != "undefined") {
            if (cql_params.length > 0) {
                query = query + ',';
            }
            query = query + ' contactViaEmail = ? ';
            cql_params.push(data.contactViaEmail);
        }
        if (typeof(data.device_token) != "undefined") {
            if (cql_params.length > 0) {
                query = query + ',';
            }
            query = query + ' device_token = ? ';
            cql_params.push(data.device_token);
        }
        if (typeof(data.facebook_id) != "undefined") {
            self.getByFacebookId(data.facebook_id, function (err, res) {
                if (res && res.length > 0 && res[0].user_id.toString() !== data.user_id) {
                    return callback(null, {
                        status: 409,
                        errorMsg: 'User already exists with given facebook_id'
                    });
                }
                else {
                    query = query + ' WHERE user_id = ?';
                    cql_params.push(data.user_id);

                    client.execute(query, cql_params, {
                        prepare: true
                    }, function (err, result) {
                        if (err) {
                            log.error(err.toString());
                            return callback(err);
                        }
                        if (data.fbAccessToken !== undefined) {
                            log.debug("Checking Facebook for new Kiggit friends");
                            facebookController.getKiggitFriends(data.facebook_id, data.fbAccessToken, function (err, friends) {
                                if (err || friends.statusCode !== 200) {
                                    //Ignore
                                    log.debug(friends.statusCode + ' ' + friends.message);
                                    return callback(err);
                                }
                                else {
                                    log.debug("Found friends: " + friends);
                                    var added_friends = [];
                                    async.each(friends.friends, function (fbFriend, cb) {
                                        friendController.getUserIdFromFacebookId(fbFriend.id, function (err, res) {
                                            if (err || res === undefined || res.length === 0) {
                                                //Ignore
                                                cb();
                                            }
                                            else {
                                                friendController.getFriendById(data.user_id, res[0].user_id, function (err, res1) {
                                                    if (err || res1.length > 0) {
                                                        //Ignore
                                                        cb();
                                                    }
                                                    else {
                                                        // Add new Kiggit friend
                                                        friendController.addFriend(data.user_id, res[0].user_id, function (err, res2) {
                                                            if (err) {
                                                                //Ignore
                                                                log.debug(err.toString());
                                                                cb();
                                                            }
                                                            else {
                                                                var added_friend = {
                                                                    user_id: res[0].user_id,
                                                                    name: fbFriend.name
                                                                };
                                                                added_friends.push(added_friend);
                                                                cb();
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }, function (err) {
                                        if (err) {
                                            // TODO
                                        }
                                        log.debug("Added friends: " + friends.length);
                                        return callback(null, added_friends);

                                    });
                                }
                            });
                        }
                        else {
                            return callback(null);
                        }
                    });
                }
            });
        }
        else {
            query = query + ' WHERE user_id = ?';
            cql_params.push(data.user_id);

            client.execute(query, cql_params, {
                prepare: true
            }, function (err, result) {
                if (err) {
                    log.error(err.toString());
                    return callback(err);
                }
                return callback(null);
            });
        }
    };

    /**
     * Updates the user serach table for auto complete searches. The idea behind the auser search table is that the first
     * USER_SEARCH_PREFIX_CHARS is added to the table as a primary key. If the USER_SEARCH_PREFIX_CHARS value is changed
     * then all rows in the user search table has to be deleted and added again. A job is being developed for this reason.
     *
     * @param user_id
     * @param callback
     */
    this.updateUserSearch = function (user_id, callback) {
        self.getByUserId(user_id, function (err, result) {
            if (result.rows.length === 0) {
                return callback();
            }
            var batch_query = [];
            // INSERT username if it's not a UUID
            /*            if (user.username && !user.username.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)) {
             batch_query.push({
             query: 'INSERT INTO user_search (prefix, suffix, fulltext, user_id)' +
             'VALUES(?,?,?,?)',
             params: [user.username.substring(0, USER_SEARCH_PREFIX_CHARS).toLowerCase(), user.username.substring(USER_SEARCH_PREFIX_CHARS).toLowerCase(), user.username, user.user_id]
             });
             }*/
            var user = result.rows[0];
            // GIVEN_NAME
            if (user.first_name) {
                batch_query.push({
                    query: 'INSERT INTO user_search (prefix, suffix, fulltext, user_id)' +
                    'VALUES(?,?,?,?)',
                    params: [user.first_name.substring(0, USER_SEARCH_PREFIX_CHARS).toLowerCase(), user.last_name.substring(USER_SEARCH_PREFIX_CHARS).toLowerCase(), user.first_name, user.user_id]
                });
            }
            // FAMILY_NAME
            if (user.last_name) {
                batch_query.push({
                    query: 'INSERT INTO user_search (prefix, suffix, fulltext, user_id)' +
                    'VALUES(?,?,?,?)',
                    params: [user.last_name.substring(0, USER_SEARCH_PREFIX_CHARS).toLowerCase(), user.last_name.substring(USER_SEARCH_PREFIX_CHARS).toLowerCase(), user.last_name, user.user_id]
                });
            }
            // GIVEN_NAME + FAMILY_NAME
            if (user.first_name && user.last_name) {
                var fullName = user.first_name + ' ' + user.last_name;
                batch_query.push({
                    query: 'INSERT INTO user_search (prefix, suffix, fulltext, user_id)' +
                    'VALUES(?,?,?,?)',
                    params: [fullName.substring(0, USER_SEARCH_PREFIX_CHARS).toLowerCase(),
                        fullName.substring(USER_SEARCH_PREFIX_CHARS).toLowerCase(),
                        fullName,
                        user.user_id]
                });
            }
            // EMAIL
            if (user.email) {
                batch_query.push({
                    query: 'INSERT INTO user_search (prefix, suffix, fulltext, user_id)' +
                    'VALUES(?,?,?,?)',
                    params: [user.email.substring(0, USER_SEARCH_PREFIX_CHARS).toLowerCase(), user.email.substring(USER_SEARCH_PREFIX_CHARS).toLowerCase(), user.email, user.user_id]
                });
            }
            if (batch_query.length > 0) {
                client.batch(batch_query, {
                    prepare: true
                }, function (err, result) {
                    if (err) {
                        Logger.error(err.toString());
                        return callback(err);
                    }
                    callback();
                });
            }
            else {
                callback();
            }
        });
    };

    this.delete = function (user_id, callback) {
        var query = 'UPDATE user SET deleted = ? WHERE user_id = ?';
        client.execute(query, [new Date(), user_id],
            {prepare: true},
            function (err, res) {
                if (err) {
                    log.error(err.toString());
                    return callback(err);
                }
                callback();
            });
    };

    this.logLogin = function (email, host, success, reason, callback) {
        var insert_user_query = 'INSERT INTO ' + config.kiggit.keyspace + '.user_login ' +
            '(email, login_time, from_host, success, reason) ' +
            'VALUES (?,?,?,?,?)';
        client.execute(insert_user_query, [
            '' + email, new Date(), host, success, reason], {
            prepare: true
        }, function (err) {
            if (err) {
                callback(err);
            } else {
                callback(null);
            }
        });
    };

    this.addReference = function (user_id, reference, callback) {
        var query = 'INSERT INTO ' + config.kiggit.keyspace + '.user_has_reference ' +
            '(user_id, reference) VALUES (?,?)';
        client.execute(query, [user_id, reference], {
            prepare: true
        }, function (err) {
            if (err) {
                callback(err);
            } else {
                callback(null);
            }
        });
    };

    this.getReference = function (user_id, callback) {
        var query = 'SELECT * FROM ' + config.kiggit.keyspace + '.user_has_reference ' +
            'WHERE user_id = ?';
        client.execute(query, [
            user_id], {
            prepare: true
        }, function (err, res) {
            if (err) {
                callback(err);
            } else {
                callback(null, res);
            }
        });
    };

    this.getProfilePicUrl = function (user_id, callback) {
        var query = 'SELECT profile_pic_url FROM user WHERE user_id = ?';
        client.execute(query, [user_id], {prepare: true},
            function (err, res) {
                if (err || res.rows.length === 0) {
                    return callback(null, '');
                }
                return callback(null, res.rows[0].profile_pic_url);
            });
    };

    this.getByFacebookId = function (facebook_id, callback) {
        var query = 'SELECT * FROM user WHERE facebook_id = ?';
        client.execute(query, [facebook_id], {prepare: true},
            function (err, res) {
                if (err || !res || !res.rows) {
                    return callback(null, []);
                }
                return callback(null, res.rows);
            });
    };

    this.pinlogin = function (user_id, callback) {
        var query = 'SELECT * FROM user WHERE user_id = ?';
        client.execute(query, [user_id], {prepare: true},
            function (err, res) {
                if (err || !res || !res.rows) {
                    return callback(null, []);
                }
                return callback(null, res.rows);
            });
    };

    this.exclude = function (user_id, date, callback) {
        var query = 'UPDATE user SET exclusion = ? WHERE user_id = ?';
        client.execute(query, [date, user_id], {prepare: true},
            function (err, res) {
                if (err) {
                    log.error(err.toString());
                    return callback(err);
                }
                callback(null, res);
            });
    };


}

module.exports = new Controller();