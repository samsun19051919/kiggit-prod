global.config = require('konfig')({
    path: './config'
});

var async = require('async');
var keyspace = require('./model/Keyspace');
var matchTable = require('./model/MatchTables');
var teamTable = require('./model/TeamTable');
var betslipTable = require('./model/BetslipTables');
var userTable = require('./model/UserTables');
var predictionTable = require('./model/PredictionTable');
var migrationTable = require('./model/MigrationTables.js');
var cassandra = require('cassandra-driver');
var client = new cassandra.Client({
    contactPoints: [config.kiggit.host],
    keyspace: config.kiggit.keyspace
});

async.series([
        function (callback) {
            keyspace.create(client, function () {
                callback(null, 'keyspace');
            });
        },
        function (callback) {
            matchTable.create(client, function () {
                callback(null, 'upcoming_matches');
            });
        },
        function (callback) {
            teamTable.create(client, function () {
                callback(null, 'teams');
            });
        },
        function (callback) {
            betslipTable.create(client, function () {
                callback(null, 'betslip');
            });
        },
        function (callback) {
            userTable.create(client, function () {
                callback(null, 'user');
            });
        },
        function (callback) {
            predictionTable.create(client, function () {
                callback(null, 'user');
            });
        },
        function (callback) {
            migrationTable.create(client, function () {
                callback(null, 'user');
            });
        }

    ],
    function (err, results) {
        console.log("results: " + results);
        process.exit(code = 0);
    }
)
;
