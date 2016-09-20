global.config = require('konfig')({
    path: './config'
});

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

// Create back-up table
// Copy all rows to new table
// Re-create table
// Copy rows back

exports.runMigration = function (callback) {
    try {
        async.series([
                function (callback) {
                    var query = 'DROP TABLE IF EXISTS settled_betslips';
                    client.execute(query, [], function (err, result) {
                        if (err) {
                            return callback(err);
                        }
                        callback(null, 'start');
                    });
                },
                function (callback) {
                    var query = 'CREATE TABLE settled_betslips (' +
                                'betslip_id uuid PRIMARY KEY,' +
                                'resolved boolean,' +
                                'settled_time timestamp)';
                    client.execute(query, [], function (err, result) {
                        if (err) {
                            console.log(err);
                            return callback(err);
                        }
                        callback(null, '1');
                    });
                },
                function (callback) {
                    var query = 'SELECT * FROM  ' + config.kiggit.keyspace + '.setlled_betslips ';
                    client.execute(query, [], function (err, result) {
                        if (err) {
                            console.log(err);
                            return callback(err);
                        }
                        var batch_query = [];
                        var hints = [];
                        async.forEach(result.rows, function (transaction, cb) {
                            batch_query.push({
                                query: 'INSERT INTO settled_betslips (betslip_id, resolved, settled_time) ' +
                                'VALUES(?,?,?)',
                                params: [transaction.betslip_id, transaction.resolved, transaction.setlled_time]
                            });
                            // Hints has to be in this form for int (position) to work. And the hints can't be part of batch_query
                            hints.push(['uuid', 'uuid', 'int']);
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
                    var chapter_query = 'DROP TABLE IF EXISTS setlled_betslips';
                    client.execute(chapter_query, [], function (err, result) {
                        if (err) {
                            console.log(err);
                            return callback(err);
                        }
                        callback(null, 'end');
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




