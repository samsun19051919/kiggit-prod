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

exports.runMigration = function (callback) {
    try {
        async.series([
                function (callback) {
                    var query = 'ALTER TABLE betslip ADD price int';
                    client.execute(query, [], function (err, result) {
                        if (err) {
                            return callback(err);
                        }
                        callback(null, 'start');
                    });
                },
                function (callback) {
                    var query = 'ALTER TABLE betslip ADD betslip_type text';
                    client.execute(query, [], function (err, result) {
                        if (err) {
                            return callback(err);
                        }
                        callback(null, 'start');
                    });
                },
                function (callback) {
                    var query = 'SELECT * FROM  ' + config.kiggit.keyspace + '.betslip ';
                    client.execute(query, [], function (err, result) {
                        if (err) {
                            console.log(err);
                            return callback(err);
                        }
                        var batch_query = [];
                        var hints = [];
                        async.forEach(result.rows, function (transaction, cb) {
                            batch_query.push({
                                query: 'UPDATE betslip SET betslip_type = ? WHERE betslip_id =  ?',
                                params: ['user', transaction.betslip_id]
                            });
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




