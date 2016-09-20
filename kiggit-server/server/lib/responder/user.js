'use strict';

/**
 * Authenticates returning users, and creates new ones.
 *
 * Creating a user may actually mean "promoting" one, as users may have been created if they've been challenged to a
 * game by an existing user.
 *
 * @emits joined(user)
 *
 * Users are keyed by their Facebook ID or email address (id being a text field), although currently we don't register
 * users by email. Eventually we should consider how to handle disparate user registrations and the merging of them.
 */

var tools = require('../tools');
var log = tools.logger;
var async = require('async');
var util = require('util');
var events = require('events');
var client = require('../database/dbClient').init();
var userController = require('../controller/user');
var bcrypt = require('bcrypt');
var uuid = require("node-uuid");
var self;
var USER_SEARCH_PREFIX_CHARS = 3;
var facebookController = require('../facebook');
var friendController = require('../controller/friend');
var validator = require("email-validator");

function UserResponder() {
    self = this;

    this.register = function (ws, data, callback) {
        if (!data.email || !data.first_name || !data.last_name || !data.password || !data.device) {
            log.debug && log.debug('user.register', 'Rejecting request with insufficient or bad data', data);
            return callback(null, {
                status: 400,
                errorMsg: 'Rejecting request with insufficient or bad data',
                requiredFields: ['email', 'first_name', 'last_name', 'password', 'device']
            });
        }
        validator.validate_async(data.email, function (err, isValidEmail) {
            if (!isValidEmail) {
                return callback(null, {status: 400, errorMsg: "Email address has wrong format"});
            }
            else {
                userController.getByEmail(data.email, function (err, res) {
                        if (res.rows && res.rows.length > 0) {
                            return callback(null, {status: 400, errorMsg: 'Email address is already in use'});
                        }

                        var profile_pic_url = '';
                        if (data.facebook_id) {
                            userController.getByFacebookId(data.facebook_id, function (err, res) {
                                if (res.length > 0) {
                                    return callback(null, {
                                        status: 409,
                                        errorMsg: 'User already exists with given facebook_id'
                                    });
                                }
                                else {
                                    profile_pic_url = util.format(config.kiggit.fb_pic_url, data.facebook_id);

                                    var user_id = uuid.v4();

                                    userController.updateUserSearch(user_id, function (err, result) {
                                        if (data.fbAccessToken !== undefined) {
                                            log.debug("Checking Facebook for new Kiggit friends");
                                            facebookController.getKiggitFriends(data.facebook_id, data.fbAccessToken, function (err, friends) {
                                                if (friends.statusCode !== 200) {
                                                    log.debug && log.debug('user.register', res.message, data);
                                                    return callback(null, {
                                                        status: 403,
                                                        errorMsg: res.message
                                                    });
                                                }
                                                else {

                                                    var added_friends = [];
                                                    async.each(friends.friends, function (fbFriend, cb) {
                                                            friendController.getUserIdFromFacebookId(fbFriend.id, function (err, res) {
                                                                if (err || res === undefined || res.length === 0) {
                                                                    //Ignore
                                                                    cb();
                                                                }
                                                                else {
                                                                    friendController.getFriendById(user_id, res[0].user_id, function (err, res1) {
                                                                        if (err || res1.length > 0) {
                                                                            //Ignore
                                                                            cb();
                                                                        }
                                                                        else {
                                                                            // Add new Kiggit friend
                                                                            friendController.addFriend(user_id, res[0].user_id, function (err, res2) {
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

                                                        }
                                                        ,
                                                        function (err) {
                                                            if (err) {
                                                                // TODO
                                                            }
                                                            bcrypt.genSalt(10, function (err, salt) {
                                                                if (err) {
                                                                    callback(err);
                                                                }
                                                                bcrypt.hash(data.password, salt, function (err, hash) {
                                                                    if (err) {
                                                                        callback(err);
                                                                    }

                                                                    var insert_user_query = 'INSERT INTO user ' +
                                                                        '(user_id, email, first_name, last_name, country, facebook_id, ' +
                                                                        'password, gender, created, deleted, locale, security_number, ' +
                                                                        'county, area_code, city_name, street_name, street_number, floor, ' +
                                                                        'date_of_birth, device, fb_access_token, profile_pic_url, device_token) ' +
                                                                        'VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
                                                                    client.execute(insert_user_query, [
                                                                        user_id, data.email, data.first_name, data.last_name, data.country,
                                                                        data.facebook_id, hash, data.gender, new Date(), null, data.locale,
                                                                        data.security_number, data.county, data.area_code, data.city_name, data.street_name,
                                                                        data.street_number, data.floor, data.date_of_birth, data.device, data.fbAccessToken,
                                                                        profile_pic_url, data.device_token], {
                                                                        prepare: true
                                                                    }, function (err) {
                                                                        if (err) {
                                                                            log.error(err.toString());
                                                                            return callback(err);
                                                                        }
                                                                        var money_query = 'UPDATE money_counter SET counter_value = counter_value + 0 WHERE user_id = ? ';
                                                                        client.execute(money_query, [user_id], {
                                                                            prepare: true
                                                                        }, function (err, res) {
                                                                            if (err) {
                                                                                log.error && log.error('BetslipResponder.register', 'Failed to update user money_size counter', data, err);
                                                                                return callback(err);
                                                                            }


                                                                            ws.client = {
                                                                                user: {
                                                                                    user_id: user_id
                                                                                }
                                                                            };
                                                                            ws.emit('authorized');
                                                                            return callback(null, {
                                                                                status: 201,
                                                                                data: {
                                                                                    user_id: user_id,
                                                                                    added_friends: added_friends
                                                                                }
                                                                            });
                                                                        });

                                                                    });
                                                                });
                                                            });
                                                        }
                                                    );
                                                }
                                            });
                                        }
                                        else {
                                            ws.client = {
                                                user: {
                                                    user_id: user_id
                                                }
                                            };
                                            ws.emit('authorized');
                                            return callback(null, {status: 201, data: {user_id: user_id}});
                                        }

                                    });


                                }
                            });
                        }
                        else {
                            var user_id = uuid.v4();
                            bcrypt.genSalt(10, function (err, salt) {
                                if (err) {
                                    callback(err);
                                }
                                bcrypt.hash(data.password, salt, function (err, hash) {
                                    if (err) {
                                        callback(err);
                                    }

                                    var insert_user_query = 'INSERT INTO user ' +
                                        '(user_id, email, first_name, last_name, country, facebook_id, ' +
                                        'password, gender, created, deleted, locale, security_number, ' +
                                        'county, area_code, city_name, street_name, street_number, floor, ' +
                                        'date_of_birth, device, fb_access_token, profile_pic_url, device_token) ' +
                                        'VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
                                    client.execute(insert_user_query, [
                                        user_id, data.email, data.first_name, data.last_name, data.country,
                                        data.facebook_id, hash, data.gender, new Date(), null, data.locale,
                                        data.security_number, data.county, data.area_code, data.city_name, data.street_name,
                                        data.street_number, data.floor, data.date_of_birth, data.device, data.fbAccessToken,
                                        profile_pic_url, data.device_token], {
                                        prepare: true
                                    }, function (err) {
                                        if (err) {
                                            log.error(err.toString());
                                            return callback(err);
                                        }
                                        var money_query = 'UPDATE money_counter SET counter_value = counter_value + 0 WHERE user_id = ? ';
                                        client.execute(money_query, [user_id], {
                                            prepare: true
                                        }, function (err, res) {
                                            if (err) {
                                                log.error && log.error('BetslipResponder.register', 'Failed to update user money_size counter', data, err);
                                                return callback(err);
                                            }
                                            userController.updateUserSearch(user_id, function (err, result) {
                                                if (err) {
                                                    // Ignore
                                                }
                                                ws.client = {
                                                    user: {
                                                        user_id: user_id
                                                    }
                                                };

                                                ws.emit('authorized');
                                                return callback(null, {status: 202, data: {user_id: user_id}});
                                            });

                                        });
                                    });
                                });
                            });
                        }

                    }
                )
                ;
            }
        })
        ;
    }
    ;

    /**
     * Authorize returning user, or create new ones by authenticating using a Facebook access token or an email:pwd
     * combo.
     *
     * @param  {object}   ws       The web socket we're authorizing for
     * @param  {object}   data     JSON payload
     * @param  {function} callback Callback(error, response)
     *
     * @return {void}
     */
    this.authenticate = function (ws, data, callback) {
        if (!data.email || !data.password) {
            log.debug && log.debug('user.authenticate', 'Rejecting request with insufficient or bad data', data);
            userController.logLogin(data.email, data.client_ip, false, 'Rejecting request with insufficient or bad data', function (err, res) {
                return callback(null, {
                    status: 400,
                    errorMsg: 'Rejecting request with insufficient or bad data',
                    requiredFields: ['email', 'password']
                });
            });
        }
        else if (!tools.emailIsValid(data.email)) {
            userController.logLogin(data.email, data.client_ip, false, 'Invalid email address', function (err, res) {
                return callback(null, {status: 400, errorMsg: 'Invalid email address'});
            });
        }
        else {
            userController.getByEmail(data.email, function (err, res) {
                if (res.rows.length === 0) {
                    userController.logLogin(data.email, data.client_ip, false, 'User not found', function (err, res) {
                        return callback(null, {status: 404, errorMsg: 'User not found'});
                    });
                }
                else {
                    var user = res.rows[0];
                    delete user.security_number;

                    if (user.deleted !== null) {
                        log.error && log.error('UserResponder.authenticate', 'Email address not found', err, data);
                        userController.logLogin(data.email, data.client_ip, false, 'Email address not found', function (err, res) {
                            return callback(null, {
                                status: 404,
                                errorMsg: 'Email address not found'
                            });
                        });
                    }
                    else {
                        bcrypt.compare(data.password, user.password, function (err, authSucess) {
                            if (!authSucess) {
                                return callback(null, {
                                    status: 401,
                                    errorMsg: 'Rejecting email authentication due to mismatching password'
                                });
                            } else {
                                //else {
                                // Register login
                                userController.logLogin(data.email, data.client_ip, true, '', function (err, res) {
                                    delete user.password;
                                    delete user.pin_code;
                                    if (user.pin_code !== undefined && user.pin_code.length > 0) {
                                        user.pin_code = true;
                                    }
                                    else {
                                        user.pin_code = false;
                                    }
                                    userController.getWalletAmount(user.user_id, function (err, res) {
                                        user.amount = parseInt(res);
                                        if (user.fb_access_token !== null) {
                                            log.debug("Checking Facebook for new Kiggit friends");
                                            facebookController.getKiggitFriends(user.facebook_id, user.fb_access_token, function (err, res) {
                                                if (res.statusCode !== 200) {
                                                    log.debug && log.debug('user.register', res.message, data);
                                                    return callback(null, {
                                                        status: 403,
                                                        errorMsg: res.message
                                                    });
                                                }
                                                else {
                                                    var added_friends = [];
                                                    async.each(res.friends, function (fbFriend, cb) {
                                                        friendController.getUserIdFromFacebookId(fbFriend.id, function (err, res) {
                                                            if (err || res === undefined || res.length === 0) {
                                                                //Ignore
                                                                cb();
                                                            }
                                                            else {
                                                                friendController.getFriendById(user.user_id, res[0].user_id, function (err, res1) {
                                                                    if (err || res1.length > 0) {
                                                                        //Ignore
                                                                        cb();
                                                                    }
                                                                    else {
                                                                        // Add new Kiggit friend
                                                                        friendController.addFriend(user.user_id, res[0].user_id, function (err, res2) {
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
                                                        user.added_friends = added_friends;

                                                        ws.client = {
                                                            user: {
                                                                user_id: user.user_id
                                                            }
                                                        };
                                                        ws.emit('authorized');
                                                        return callback(null, {status: 200, data: user});

                                                    });
                                                }
                                            });
                                        }
                                        else {
                                            ws.client = {
                                                user: {
                                                    user_id: user.user_id
                                                }
                                            };
                                            ws.emit('authorized');
                                            return callback(null, {status: 200, data: user});
                                        }
                                    });
                                });

                            }
                        });
                    }
                    //}
                }
            });
        }
        ;
    };

    /**
     * Generate new intermediate password for user.
     *
     * @param  {object}   ws       The web socket we're authorizing for
     * @param  {object}   data     JSON payload
     * @param  {function} callback Callback(error, response)
     *
     * @return {void}
     */
    this.newpasswd = function (ws, data, callback) {
        try {
            if (!data.email) {
                log.debug && log.debug('user.newpasswd', 'Rejecting request with insufficient or bad data', data);
                return callback(null, {
                    status: 400,
                    errorMsg: 'Rejecting request with insufficient or bad data',
                    requiredFields: ['email']
                });
            }
            userController.getByEmail(data.email, function (err, res) {
                if (res.rows.length === 0) {
                    log.debug && log.debug('user.newpasswd', 'Email not found', data);
                    return callback(null, {
                        status: 404,
                        errorMsg: 'Email not found',
                        requiredFields: []
                    });
                }
                var user = res.rows[0];
                userController.generatePassword(function (err, res1) {
                    if (err) {
                        log.error(err.toString());
                        return callback(err);
                    }
                    userController.updatePassword(user.user_id, res1, function (err, res2) {
                        tools.sendPasswordReset(user.email, user.user_id, function (err, resq) {
                            if (err) {
                                log.debug(err.toString());
                                return callback(err);
                            }
                            callback(null, {status: 201, data: {}});
                        });
                    });
                });
            });
        }
        catch (ex) {
            log.debug(ex);
        }
    };

    /**
     * Updates password for user.
     *
     * @param  {object}   ws       The web socket we're authorizing for
     * @param  {object}   data     JSON payload
     * @param  {function} callback Callback(error, response)
     *
     * @return {void}
     */
    this.uppasswd = function (ws, data, callback) {
        if (!data.user_id || !data.new_password || !data.old_password) {
            log.debug && log.debug('user.uppasswd', 'Rejecting request with insufficient or bad data', data);
            return callback(null, {
                status: 400,
                errorMsg: 'Rejecting request with insufficient or bad data',
                requiredFields: ['user_id', 'new_password', 'old_password']
            });
        }
        userController.getByUserId(data.user_id, function (err, res) {
            if (err) {
                log.error(err.toString());
                return callback(err);
            }
            if (res.rows.length === 0) {
                return callback(null, {status: 404, errorMsg: 'User not found'});
            }
            var user = res.rows[0];
            bcrypt.compare(data.old_password, user.password, function (err, authAccess) {
                if (!authAccess) {
                    return callback(null, {status: 401, errorMsg: 'Rejecting request due to inconsistent data'});
                }
                else {
                    bcrypt.genSalt(10, function (err, salt) {
                        if (err) {
                            callback(err);
                        }
                        bcrypt.hash(data.new_password, salt, function (err, hash) {
                            if (err) {
                                callback(err);
                            }

                            userController.updatePassword(data.user_id, hash, function (err, res1) {
                                if (err) {
                                    log.error(err.toString());
                                    return callback(err);
                                }
                                callback(null, {status: 202});
                            });
                        });
                    });
                }
            })

        })
    };

    /**
     * Sets 4-digit code for user.
     *
     * @param  {object}   ws       The web socket we're authorizing for
     * @param  {object}   data     JSON payload
     * @param  {function} callback Callback(error, response)
     *
     * @return {void}
     */
    this.setcode = function (ws, data, callback) {
        if (!data.user_id || !data.pincode || !data.password) {
            log.debug && log.debug('user.setcode', 'Rejecting request with insufficient or bad data', data);
            return callback(null, {
                status: 400,
                errorMsg: 'Rejecting request with insufficient or bad data',
                requiredFields: ['user_id', 'pincode']
            });
        }
        userController.getByUserId(data.user_id, function (err, res) {
            if (err || !res.rows || res.rows.length === 0) {
                log.debug && log.debug('user.setcode', 'User not found', data);
                return callback(null, {
                    status: 404,
                    errorMsg: 'User not found',
                    requiredFields: ['user_id', 'code', 'password']
                });
            }
            var user = res.rows[0];
            bcrypt.compare(data.password, user.password, function (err, authAccess) {
                if (!authAccess) {
                    log.error && log.error('UserResponder.authenticate', 'Rejecting email authentication due to mismatching password', err, data);
                    userController.logLogin(data.email, data.client_ip, false, 'Rejecting email authentication due to mismatch between username and password', function (err, res) {
                        return callback(null, {
                            status: 401,
                            errorMsg: 'Rejecting email authentication due to mismatching password'
                        });
                    });
                }
                else {
                    bcrypt.genSalt(10, function (err, salt) {
                        if (err) {
                            callback(err);
                        }
                        bcrypt.hash(data.pincode, salt, function (err, hash) {
                            if (err) {
                                callback(err);
                            }
                            userController.setCode(data.user_id, hash, function (err, res1) {
                                if (err) {
                                    log.error(err.toString());
                                    return callback(err);
                                }
                                callback(null, {status: 202});
                            });
                        });
                    });
                }
            })
        });
    };

    /**
     * Gets all friends for a user
     *
     * @param  {object}   ws       The web socket we're authorizing for
     * @param  {object}   data     JSON payload
     * @param  {function} callback Callback(error, response)
     *
     * @return {void}
     */
    this.friends = function (ws, data, callback) {
        if (!data.user_id) {
            log.debug && log.debug('user.friends', 'Rejecting request with insufficient or bad data', data);
            return callback(null, {
                status: 400,
                errorMsg: 'Rejecting request with insufficient or bad data',
                requiredFields: ['user_id']
            });
        }
        userController.getFriends(data.user_id, function (err, res) {
            if (err) {
                log.error(err.toString());
                return callback(err);
            }
            var friends = [];
            async.each(res, function (row, cb) {
                userController.getByUserId(row.friend_id, function (err, res1) {
                    if (res1.rows.length === 0) {
                        cb();
                    }
                    else {
                        var friend = res1.rows[0];
                        friend.user_id = res1.rows[0].user_id;
                        friend.facebook_id = res1.rows[0].facebook_id;
                        friend.name = res1.rows[0].first_name + ' ' + res1.rows[0].last_name;
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
        });
    };

    this.update = function (ws, data, callback) {
        if (!data.user_id) {
            log.debug && log.debug('user.update', 'Rejecting request with insufficient or bad data', data);
            return callback(null, {
                status: 400,
                errorMsg: 'Rejecting request with insufficient or bad data',
                requiredFields: ['user_id']
            });
        }
        userController.update(data, function (err, res) {
            if (err) {
                log.error(err.toString);
                return callback(err);
            }
            if (res && res.status === 409) {
                return callback(null, {
                    status: 409,
                    errorMsg: 'User already exists with given facebook_id'
                });
            }
            else {
                userController.updateUserSearch(data.user_id, function (err, result) {
                    if (err) {
                        // Ignore
                    }
                    log.debug("Returning friends: " + res);
                    return callback(null, {status: 202, data: {added_friends: res}});
                });
            }
        });
    };

    this.search = function (ws, data, callback) {
        if (!data.search) {
            log.debug && log.debug('user.search', 'Rejecting request with insufficient or bad data', data);
            return callback(null, {
                status: 400,
                errorMsg: 'Rejecting request with insufficient or bad data',
                requiredFields: ['search']
            });
        }
        var query = '';
        var cql_params;

        if (data.search.length < USER_SEARCH_PREFIX_CHARS) {
            return callback(null, {status: 200, data: {}});
        }
        if (data.search.length === USER_SEARCH_PREFIX_CHARS) {
            query = 'SELECT user_id FROM user_search WHERE prefix = ? ';
            cql_params = [data.search];
        }
        if (data.search.length > USER_SEARCH_PREFIX_CHARS) {
            var suffix_1 = data.search.substring(USER_SEARCH_PREFIX_CHARS);
            var suffix_2 = suffix_1.substring(0, suffix_1.length - 1) + String.fromCharCode(suffix_1.substring(suffix_1.length - 1).charCodeAt(0) + 1);
            query = 'SELECT user_id FROM user_search WHERE prefix = ? and suffix >= ? and suffix < ?';
            cql_params = [data.search.substring(0, USER_SEARCH_PREFIX_CHARS), suffix_1, suffix_2];
        }
        client.execute(query, cql_params, {
            prepare: true
        }, function (err, result) {
            if (err) {
                Logger.error(err.toString());
                return callback(null, {status: 400, data: {}});
            } else {
                query = 'SELECT * FROM user WHERE user_id in ?;';
                var userArray = [];
                async.forEach(result.rows, function (user, cb) {
                    userArray.push(user.user_id);
                    cb();
                }, function (err) {
                    if (userArray.length > 0) {
                        client.execute(query, [userArray], {
                            prepare: true
                        }, function (err, result) {
                            if (err) {
                                Logger.error(err.toString());
                                return callback(null, {status: 500});
                            }
                            var userReturnArray = [];
                            async.forEach(result.rows, function (user, cb) {
                                if (user.deleted) {
                                } else {
                                    delete user.password;
                                    delete user.updated;
                                    delete user.created;
                                    delete user.security_number;
                                    userReturnArray.push(user);
                                }
                                cb();
                            }, function (err) {
                                return callback(null, {status: 200, data: {friends: userReturnArray}});
                            });
                        });
                    } else {
                        return callback(null, {status: 200, data: {}});
                    }
                });
            }
        });
    };

    this.delete = function (ws, data, callback) {
        if (!data.user_id) {
            log.debug && log.debug('user.delete', 'Rejecting request with insufficient or bad data', data);
            return callback(null, {
                status: 400,
                errorMsg: 'Rejecting request with insufficient or bad data',
                requiredFields: ['user_id']
            });
        }
        userController.delete(data.user_id, function (err, res) {
            if (err) {
                log.error(err.toString());
                return callback(err);
            }
            return callback(null, {status: 202, data: {}});
        });
    };

    this.getById = function (ws, data, callback) {
        if (!data.user_id) {
            log.debug && log.debug('user.getById', 'Rejecting request with insufficient or bad data', data);
            return callback(null, {
                status: 400,
                errorMsg: 'Rejecting request with insufficient or bad data',
                requiredFields: ['user_id']
            });
        }
        userController.getByUserId(data.user_id, function (err, res) {
            if (err) {
                log.error(err.toString());
                return callback(err);
            }
            if (res.rows.length === 0) {
                return callback(null, {status: 404, errorMsg: 'User not found', requiredFields: []});
            }
            return callback(null, {status: 200, data: {user: res.rows[0]}});
        });
    };

    this.getByEmail = function (ws, data, callback) {
        if (!data.email) {
            log.debug && log.debug('user.getByEmail', 'Rejecting request with insufficient or bad data', data);
            return callback(null, {
                status: 400,
                errorMsg: 'Rejecting request with insufficient or bad data',
                requiredFields: ['email']
            });
        }
        userController.getByEmail(data.email, function (err, res) {
            if (err) {
                log.error(err.toString());
                return callback(err);
            }
            if (res.rows.length === 0) {
                return callback(null, {status: 404, errorMsg: 'User not found', requiredFields: []});
            }
            return callback(null, {status: 200, data: {user: res.rows[0]}});
        });
    };

    /**
     * Authorises user via pin login.
     *
     * @param  {object}   ws       The web socket we're authorizing for
     * @param  {object}   data     JSON payload
     * @param  {function} callback Callback(error, response)
     *
     * @return {void}
     */
    this.pinlogin = function (ws, data, callback) {
        if (!data.user_id || !data.pincode) {
            log.debug && log.debug('user.pinlogin', 'Rejecting request with insufficient or bad data', data);
            return callback(null, {
                status: 400,
                errorMsg: 'Rejecting request with insufficient or bad data',
                requiredFields: ['user_id', 'pincode']
            });
        }
        userController.pinlogin(data.user_id, function (err, res) {
                if (err || res.length === 0) {
                    return callback(null, {status: 404, errorMsg: 'User not found'});
                }
                var user = res[0];
                delete user.password;
                delete user.security_number;

                bcrypt.compare(data.pincode, user.pin_code, function (err, authAccess) {
                    if (!authAccess) {
                        log.error && log.error('UserResponder.authenticate', 'Rejecting email authentication due to mismatching password', err, data);
                        userController.logLogin(data.email, data.client_ip, false, 'Rejecting email authentication due to mismatch between username and password', function (err, res) {
                            return callback(null, {
                                status: 401,
                                errorMsg: 'Rejecting email authentication due to mismatching password'
                            });
                        });
                    }
                    else {
                        delete user.pin_code;
                        user.pin_code = true;
                        userController.getWalletAmount(user.user_id, function (err, res) {
                            user.amount = parseInt(res);
                            if (user.fb_access_token !== undefined) {
                                log.debug("Checking Facebook for new Kiggit friends");
                                facebookController.getKiggitFriends(user.facebook_id, user.fb_access_token, function (err, res) {
                                    if (err) {
                                        //Ignore
                                        log.debug(err.toString());
                                        return callback(err);
                                    }
                                    var added_friends = [];
                                    async.each(res, function (fbFriend, cb) {
                                        friendController.getUserIdFromFacebookId(fbFriend.id, function (err, res) {
                                            if (err || res === undefined || res.length === 0) {
                                                //Ignore
                                                cb();
                                            }
                                            else {
                                                friendController.getFriendById(user.user_id, res[0].user_id, function (err, res1) {
                                                    if (err || res1.length > 0) {
                                                        //Ignore
                                                        cb();
                                                    }
                                                    else {
                                                        // Add new Kiggit friend
                                                        friendController.addFriend(user.user_id, res[0].user_id, function (err, res2) {
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
                                        user.added_friends = added_friends;

                                        ws.client = {
                                            user: {
                                                user_id: user.user_id
                                            }
                                        };
                                        ws.emit('authorized');
                                        return callback(null, {status: 200, data: user});

                                    });
                                });
                            }
                            else {
                                ws.client = {
                                    user: {
                                        user_id: user.user_id
                                    }
                                };
                                ws.emit('authorized');
                                return callback(null, {status: 200, data: user});
                            }

                        });
                    }
                });


            }
        );
    }
    ;

    /**
     * Excludes user from access to Kiggit until given date.
     *
     * @param  {object}   ws       The web socket we're authorizing for
     * @param  {object}   data     JSON payload
     * @param  {function} callback Callback(error, response)
     *
     * @return {void}
     */
    this.exclude = function (ws, data, callback) {
        if (!data.user_id || !data.date) {
            log.debug && log.debug('user.exclude', 'Rejecting request with insufficient or bad data', data);
            return callback(null, {
                status: 400,
                errorMsg: 'Rejecting request with insufficient or bad data',
                requiredFields: ['user_id', 'date']
            });
        }
        userController.getByUserId(data.user_id, function (err, res) {
            if (err || !res.rows || res.rows.length === 0) {
                log.debug && log.debug('user.exclude', 'User not found', data);
                return callback(null, {
                    status: 404,
                    errorMsg: 'User not found'
                });
            }
            bcrypt.compare(data.password, res.rows[0].password, function (err, authSucess) {
                if (!authSucess) {
                    return callback(null, {
                        status: 401,
                        errorMsg: 'Rejecting email authentication due to mismatching password'
                    });
                }
                else {
                    userController.exclude(data.user_id, data.date, function (err, res) {
                        if (err) {
                            log.error(err.toString());
                            return callback(err);
                        }
                        return callback(null, {status: 202, data: {}});
                    });
                }
            });
        });
    }
}
;


util.inherits(UserResponder, events.EventEmitter);
module.exports = new UserResponder();
