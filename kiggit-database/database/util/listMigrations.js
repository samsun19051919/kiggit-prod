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
        , colWidths: [20, 50, 20]
    });

    client.execute(query, [], {
        prepare: true
    }, function (err, result) {
        if (err) {
            console.log(err);
            process.exit();
        } else {
            migrationFiles = fs.readdirSync(path + '/migrations');
            migrationFiles = migrationFiles.sort(function (a, b) {
                return parseInt(a.split('-')[0]) - parseInt(b.split('-')[0]);
            });
            async.forEach(migrationFiles, function (file, cb) {
                if (file.indexOf('.cql') != -1 || file.indexOf('.js') != -1) {
                    id = parseInt(file.split('-')[0]);
                    name = file.split('-')[1];
                    async.forEach(result.rows, function (entry, cb2) {
                        if (entry.id === '' + id) {
                            table.push([id, name, 'yes']);
                            return cb2(true);
                        }
                        else {
                        }
                        cb2();
                    }, function (err) {
                        if (!err) {
                            table.push([id, name, 'NO']);
                        }
                    });
                }
                cb();
            }, function (err) {
                console.log(table.toString());
                process.exit();
            });
        }
    });
}
catch (ex) {
    process.exit();
}
