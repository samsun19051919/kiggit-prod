global.config = require('konfig')({
    path: './config'
});

var bcrypt = require('bcrypt');
var fs = require('fs');
var async = require('async');
var uuid = require("node-uuid");
var cassandra = require('cassandra-driver');
var authProvider = new cassandra.auth.PlainTextAuthProvider('cassandra', 'cassandra');
var client = new cassandra.Client({
    contactPoints: [config.kiggit.host],
    keyspace: config.kiggit.keyspace,
    authProvider: authProvider
});
var logger = require('../util/Logger');

// Create back-up table
// Copy all rows to new table
// Re-create table
// Copy rows back

exports.runMigration = function (callback) {
    try {
        async.series([
                function (callback) {
                    var query = 'DROP TABLE IF EXISTS userBACKUP';
                    client.execute(query, [], function (err, result) {
                        if (err) {
                            return callback(err);
                        }
                        callback(null, 'start');
                    });
                },
                function (callback) {
                    var query = 'CREATE TABLE userBACKUP (' +
                        'user_id uuid,' +
                        'area_code text,' +
                        'buy_in int,' +
                        'checked_facebook timestamp,' +
                        'city_name text,' +
                        'contactviaemail boolean,' +
                        'contactviasms boolean,' +
                        'country text,' +
                        'county text,' +
                        'created timestamp,' +
                        'date_of_birth timestamp,' +
                        'deleted timestamp,' +
                        'device text,' +
                        'device_token text,' +
                        'email text,' +
                        'exclusion timestamp,' +
                        'facebook_id text,' +
                        'fb_access_token text,' +
                        'first_name text,' +
                        'floor text,' +
                        'gender text,' +
                        'last_name text,' +
                        'locale text,' +
                        'password text,' +
                        'pin_code text,' +
                        'profile_pic_url text,' +
                        'security_number text,' +
                        'street_name text,' +
                        'street_number text,' +
                        'PRIMARY KEY (user_id))';
                    client.execute(query, [], function (err, result) {
                        if (err) {
                            console.log(err);
                            return callback(err);
                        }
                        callback(null, '1');
                    });
                },
                function (callback) {
                    var query = 'SELECT * FROM  ' + config.kiggit.keyspace + '.user ';
                    client.execute(query, [], function (err, result) {
                        if (err) {
                            console.log(err);
                            return callback(err);
                        }
                        var batch_query = [];
                        var hints = [];
                        async.forEach(result.rows, function (user, cb) {
                            batch_query.push({
                                query: 'INSERT INTO userBACKUP (' +
                                'user_id,' +
                                'area_code,' +
                                'buy_in,' +
                                'checked_facebook,' +
                                'city_name, ' +
                                'contactviaemail,' +
                                'contactviasms,' +
                                'country ,' +
                                'county ,' +
                                'created,' +
                                'date_of_birth ,' +
                                'deleted ,' +
                                'device ,' +
                                'device_token ,' +
                                'email ,' +
                                'exclusion ,' +
                                'facebook_id ,' +
                                'fb_access_token ,' +
                                'first_name ,' +
                                'floor ,' +
                                'gender ,' +
                                'last_name ,' +
                                'locale ,' +
                                'password ,' +
                                'pin_code ,' +
                                'profile_pic_url ,' +
                                'security_number,' +
                                'street_name,' +
                                'street_number) ' +
                                'VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                                params: [user.user_id, user.area_code, user.buy_in, user.checked_facebook, user.city_name,
                                    user.contactviaemail, user.contactviasms, user.country, user.county, user.created, user.date_of_birth,
                                    user.deleted, user.device, user.device_token, user.email, user.exclusion, user.facebook_id, user.fb_access_token,
                                    user.first_name, user.floor, user.gender, user.last_name, user.locale, user.password, user.pin_code,
                                    user.profile_pic_url, user.security_number, user.street_name, user.street_number]
                            });
                            // Hints has to be in this form for int (position) to work. And the hints can't be part of batch_query
                            //hints.push(['int', 'uuid', 'int', 'text', 'text']);
                            cb();
                        }, function (err) {
                            if (batch_query.length > 0) {
                                var count = 0;
                                var pointer = batch_query.length;
                                async.whilst(function () {
                                    return count < pointer;
                                }, function (callback) {
                                    client.batch(batch_query.slice(count, count + 100), {
                                        hints: hints
                                    }, function (err, result) {
                                        if (err) {
                                            return callback(err);
                                        }
                                        count = count + 100;
                                        callback();
                                    });

                                }, function (err) {
                                    callback(null, '2');
                                });
                            } else {
                                callback(null, '2');
                            }
                        });
                    });
                },
                function (callback) {
                    var query = 'DROP TABLE IF EXISTS user';
                    client.execute(query, [], function (err, result) {
                        if (err) {
                            return callback(err);
                        }
                        callback(null, '3');
                    });
                },
                function (callback) {
                    var query = 'CREATE TABLE user (' +
                        'user_id uuid,' +
                        'area_code text,' +
                        'buy_in int,' +
                        'checked_facebook timestamp,' +
                        'city_name text,' +
                        'contactviaemail boolean,' +
                        'contactviasms boolean,' +
                        'country text,' +
                        'county text,' +
                        'created timestamp,' +
                        'date_of_birth timestamp,' +
                        'deleted timestamp,' +
                        'device text,' +
                        'device_token text,' +
                        'email text,' +
                        'exclusion text,' +
                        'facebook_id text,' +
                        'fb_access_token text,' +
                        'first_name text,' +
                        'floor text,' +
                        'gender text,' +
                        'last_name text,' +
                        'locale text,' +
                        'password text,' +
                        'pin_code text,' +
                        'profile_pic_url text,' +
                        'security_number text,' +
                        'street_name text,' +
                        'street_number text,' +
                        'PRIMARY KEY (user_id))';
                    client.execute(query, [], function (err, result) {
                        if (err) {
                            console.log(err);
                            return callback(err);
                        }
                        callback(null, '4');
                    });
                },
                function (callback) {
                    var query = 'CREATE INDEX facebook_id on user (facebook_id)';
                    client.execute(query, [], function (err, result) {
                        if (err) {
                            console.log(err);
                            return callback(err);
                        }
                        callback(null, '5');
                    });
                },
                function (callback) {
                    var query = 'CREATE INDEX email on user (email)';
                    client.execute(query, [], function (err, result) {
                        if (err) {
                            console.log(err);
                            return callback(err);
                        }
                        callback(null, '6');
                    });
                },
                function (callback) {
                    var query = 'CREATE INDEX firstname on user (first_name)';
                    client.execute(query, [], function (err, result) {
                        if (err) {
                            console.log(err);
                            return callback(err);
                        }
                        callback(null, '7');
                    });
                },
                function (callback) {
                    var query = 'CREATE INDEX lastname on user (last_name)';
                    client.execute(query, [], function (err, result) {
                        if (err) {
                            console.log(err);
                            return callback(err);
                        }
                        callback(null, '8');
                    });
                },
                function (callback) {
                    var chapter_query = 'SELECT * FROM  ' + config.kiggit.keyspace + '.userBACKUP ';
                    client.execute(chapter_query, [], function (err, result) {
                        if (err) {
                            console.log(err);
                            return callback(err);
                        }
                        var batch_query = [];
                        var hints = [];
                        async.forEach(result.rows, function (user, cb) {

                            logger.debug('PINCODE ' + user.pin_code);
                            if (user.pin_code !== null) {
                                logger.debug('HASHING');
                                bcrypt.genSalt(10, function (err, salt) {
                                    if (err) {
                                        callback(err);
                                    }
                                    bcrypt.hash(user.pin_code, salt, function (err, hash) {
                                        if (err) {
                                            callback(err);
                                        }
                                        batch_query.push({
                                            query: 'INSERT INTO user (' +
                                            'user_id ,' +
                                            'area_code ,' +
                                            'buy_in ,' +
                                            'checked_facebook ,' +
                                            'city_name ,' +
                                            'contactviaemail,' +
                                            'contactviasms,' +
                                            'country,' +
                                            'county,' +
                                            'created,' +
                                            'date_of_birth,' +
                                            'deleted,' +
                                            'device,' +
                                            'device_token,' +
                                            'email,' +
                                            'exclusion,' +
                                            'facebook_id,' +
                                            'fb_access_token,' +
                                            'first_name,' +
                                            'floor,' +
                                            'gender,' +
                                            'last_name,' +
                                            'locale,' +
                                            'password,' +
                                            'pin_code,' +
                                            'profile_pic_url,' +
                                            'security_number,' +
                                            'street_name,' +
                                            'street_number) ' +
                                            'VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                                            params: [user.user_id, user.area_code, user.buy_in, user.checked_facebook, user.city_name,
                                                user.contactviaemail, user.contactviasms, user.country, user.county, user.created, user.date_of_birth,
                                                user.deleted, user.device, user.device_token, user.email, user.exclusion, user.facebook_id, user.fb_access_token,
                                                user.first_name, user.floor, user.gender, user.last_name, user.locale, user.password, hash,
                                                user.profile_pic_url, user.security_number, user.street_name, user.street_number]
                                        });
                                        cb();
                                    });
                                });
                            }
                            else {
                                logger.debug('NOT HASHING');
                                batch_query.push({
                                    query: 'INSERT INTO user (' +
                                    'user_id ,' +
                                    'area_code ,' +
                                    'buy_in ,' +
                                    'checked_facebook ,' +
                                    'city_name ,' +
                                    'contactviaemail,' +
                                    'contactviasms,' +
                                    'country,' +
                                    'county,' +
                                    'created,' +
                                    'date_of_birth,' +
                                    'deleted,' +
                                    'device,' +
                                    'device_token,' +
                                    'email,' +
                                    'exclusion,' +
                                    'facebook_id,' +
                                    'fb_access_token,' +
                                    'first_name,' +
                                    'floor,' +
                                    'gender,' +
                                    'last_name,' +
                                    'locale,' +
                                    'password,' +
                                    'pin_code,' +
                                    'profile_pic_url,' +
                                    'security_number,' +
                                    'street_name,' +
                                    'street_number) ' +
                                    'VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                                    params: [user.user_id, user.area_code, user.buy_in, user.checked_facebook, user.city_name,
                                        user.contactviaemail, user.contactviasms, user.country, user.county, user.created, user.date_of_birth,
                                        user.deleted, user.device, user.device_token, user.email, user.exclusion, user.facebook_id, user.fb_access_token,
                                        user.first_name, user.floor, user.gender, user.last_name, user.locale, user.password, user.pin_code,
                                        user.profile_pic_url, user.security_number, user.street_name, user.street_number]
                                });
                                cb();
                            }
                        }, function (err) {
                            if (batch_query.length > 0) {
                                var count = 0;
                                var pointer = batch_query.length;
                                async.whilst(function () {
                                    return count < pointer;
                                }, function (callback) {
                                    client.batch(batch_query.slice(count, count + 100), {
                                        hints: hints
                                    }, function (err, result) {
                                        if (err) {
                                            return callback(err);
                                        }
                                        count = count + 100;
                                        callback();
                                    });

                                }, function (err) {
                                    callback(null, 'end');
                                });
                            } else {
                                callback(null, 'end');
                            }
                        });
                    });
                }


            ],
            function (err, results) {
                console.log(results);
                if (err) {
                    return callback(err);
                }
                callback();
            });
    }
    catch (ex) {
        callback(ex);
    }
};



