global.config = require('konfig')({
    path: './config'
});

var fs = require('fs');
var async = require('async');
var Table = require('cli-table');
var cassandra = require('cassandra-driver');
var authProvider = new cassandra.auth.PlainTextAuthProvider(process.argv[3], process.argv[4]);
var client = new cassandra.Client({
    contactPoints: [config.kiggit.host],
    keyspace: config.kiggit.keyspace,
    authProvider: authProvider
});

var path = process.argv[2];

var query = "SELECT id FROM migrations";
try {
    var table = new Table({
        head: ['ID', 'Migration', 'DB']
        , colWidths: [20, 50, 100]
    });

    client.execute(query, [], {
        prepare: true
    }, function (err, result) {
        if (err) {
            console.log(err);
            process.exit();
        } else {
            var countFiles = 0;
            var countMigrations = 0;
            files = fs.readdirSync(path + '/migrations');
            files = files.sort(function (a, b) {
                return parseInt(a.split('-')[0]) - parseInt(b.split('-')[0]);
            });
            console.log(files);
//            files.forEach(function (file) {
            async.mapSeries(files, function (file, callback2) {
                    if (file.indexOf('.csv') != -1 || file.indexOf('.DS_Store') != -1) {
                        return callback2();
                    }
                    console.log(file);
                    var id = parseInt(file.split('-')[0]);
                    var name = file.split('-')[1];
                    var found = false;
                    result.rows.forEach(function (entry) {
                        if (entry.id === '' + id) {
                            found = true;
                            table.push([id, name, 'yes']);
                            return callback2();
                        }
                    });
                    if (!found) {
                        if (file.indexOf('.cql') != -1) {
                            countFiles++;
                            async.waterfall([
                                function (done) {
                                    fs.readFile(path + '/migrations/' + file, 'utf8', function (err, data) {
                                        if (err) {
                                            done(err);
                                        }
                                        done(null, data);
                                    });
                                },
                                function (data, done) {
                                    async.forEachSeries(data.split(';'), function (line, callback) {
                                        console.log('line', line.replace(/[\n\r]/g, ''));
                                        line = line.replace(/[\n\r]/g, '');
                                        if (line !== '') {
                                            client.execute(line, [], {prepare: false}, function (err, res) {
                                                if (err) {
                                                    return callback(err);
                                                } else {
                                                    callback();
                                                }
                                            });
                                        } else {
                                            callback();
                                        }
                                    }, function (err) {
                                        if (err) {
                                            console.log(err);
                                            return done(err);
                                        }
                                        done();
                                    });
                                },
                                function (done) {
                                    client.execute('INSERT INTO migrations(id, name, created) VALUES(?,?,?)',
                                        ['' + id, name, new Date()], {
                                            prepare: false,
                                            hints: ['text']
                                        }, function (err, res) {
                                            if (err) {
                                                return done(err);
                                            }
                                            done();
                                        });
                                }
                            ], function (err) {
                                table.push([id, name, (!err) ? 'OK' : err]);
                                countMigrations++;
                                if (countFiles === countMigrations) {
                                }
                                return callback2()
                            });
                        }
                        if (file.indexOf('.js') != -1) {
                            console.log(file, id, name);
                            try {
                                require('../migrations/' + file).runMigration(function (err, result) {
                                    console.log(err);
                                    table.push([id, name, (!err) ? 'OK' : err]);
                                    if (!err) {
                                        client.execute('INSERT INTO migrations(id, name, created) VALUES(?,?,?)',
                                            ['' + id, name, new Date()], {
                                                prepare: false,
                                                hints: ['text']
                                            }, function (err, res) {
                                                if (err) {
                                                    console.log(err);
                                                    return done(err);
                                                }
                                                callback2();
                                            });
                                    } else {
                                        callback2();
                                    }
                                });
                            } catch (ex) {
                                console.log(ex);
                                table.push([id, name, ex]);
                                callback2();
                            }
                        }
                    }
                },
                function (err, result) {
                    console.log(table.toString());
                    process.exit();
                });
        }
    });
}
catch (ex) {
    process.exit();
}

var addMigration = function (data, id, name, callback) {
    try {
        client.execute(data, [], {prepare: false}, function (err, res) {
            if (err) {
                throw err;
            }
            try {
                client.execute('INSERT INTO migrations(id, name, created) VALUES(?,?,?)',
                    ['' + id, name, new Date()], {
                        prepare: false,
                        hints: ['text']
                    }, function (err, res) {
                        if (err) {
                            throw err;
                        }
                        callback();
                    });
            } catch (ex) {
                console.log(ex);
                return callback(err);
                throw ex;
            }
        });
    } catch (ex) {
        console.log(ex);
        return callback(err);
        throw ex;
    }
};
