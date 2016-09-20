    global.config = require('konfig')({
        path: './config'
    });

    var util = require('util');
    var fs = require('fs');
    var async = require('async');
    var Table = require('cli-table');
    var uuid = require("node-uuid");
    var cassandra = require('cassandra-driver');
    var authProvider = new cassandra.auth.PlainTextAuthProvider('cassandra', 'cassandra');
    var client = new cassandra.Client({
        contactPoints: [config.kiggit.host],
        keyspace: config.kiggit.keyspace,
        authProvider: authProvider
    });

    // add column result
    // calculate result and populate result column

    exports.runMigration = function (callback) {
        async.series([
            function (callback) {
                var query = 'ALTER TABLE results ADD result text';
                client.execute(query, [], function (err, result) {
                    if (err) {
                        console.log(err);
                        return callback(err);
                    }
                    callback(null, '1');
                });
            },
            function (callback) {
                var query = 'SELECT * FROM  ' + config.kiggit.keyspace + '.results ';
                client.execute(query, [], function (err, result) {
                    if (err) {
                        console.log(err);
                        return callback(err);
                    }
                    var result;
                    async.each(result.rows, function (match, cb) {
                        if (err) {
                            console.log(err);
                            return callback(err);
                        }
                        if (match.goals_away < match.goals_home) {
                            result = "1"
                        } else if (match.goals_away == match.goals_home) {
                            result = "x"
                        } else if (match.goals_away > match.goals_home) {
                            result = "2"
                        }
                        var queryInsert = 'INSERT INTO results (match_id, result) VALUES (?,?)';
                        var params = [match.match_id, result];
                        client.execute(queryInsert, params, {prepare : true}, function (err, result) {
                            if (err) {
                                console.log(err);
                                return callback(err);
                            }
                            cb();
                        });
                    }, function(err) {
                        if(err){
                            console.log(err);
                            return callback(err);
                        }
                        callback(null, '2');
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
    };