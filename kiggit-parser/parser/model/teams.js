/**
 *  Created by Sebastian O. Jensen 28-02-2016
 **/
//var db = require('./db.js');
'use strict';
var cassandra = require('cassandra-driver');
var client = new cassandra.Client({
    contactPoints: config.kiggit.hosts,
    keyspace: config.kiggit.keyspace
});
client.connect(function(err) {
    if (err) {
        console.log("could not connect to cassandra");
    } else {
        console.log("Connected to cassandra");
    }
});

var query = 'INSERT INTO teams \
    (gender, name, id, players)\
    VALUES (?,?,?,?)';

function updateTeam(team, callback) {
    var params = [team.gender,
        team.name,
        team.id,
        team.players
    ];
    client.execute(query, params, {
        prepare: true
    }, function(err) {
        if (err) {
            console.log(err);
        } else {
            console.log('updated result');
            callback();
        }
    });
}

module.exports.updateTeam = updateTeam;