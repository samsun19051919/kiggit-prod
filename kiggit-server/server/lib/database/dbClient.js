var cassandra = require('cassandra-driver');
var tools      = require('../tools');
var Logger = require('../../util/Logger');

//var authProvider = new cassandra.auth.PlainTextAuthProvider(config.app.db_user, config.app.db_password);

var client = new cassandra.Client({
    contactPoints: config.kiggit.hosts,
    keyspace: config.kiggit.keyspace//,
    //authProvider: authProvider
});

client.connect(function (err, result) {
    if (err) {
        Logger.error('Could not connect to database. error: ' + err);
    } else {
        Logger.info('Connected to Cassandra hosts [' + config.kiggit.hosts + '] using keyspace ' + config.kiggit.keyspace);
    }
});

exports.init = function () {
    return client;
};
