/**
 *	Created by Sebastian O. Jensen 17-02-2016
 **/
//var db = require('./db.js');
"use strict";
var cassandra = require('cassandra-driver');
var util = require('util');
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

var query = 'INSERT INTO upcoming_matches \
	(scheduled_start_day,\
	 match_id,\
         away,\
         country,\
         home,\
         name,\
         scheduled_start,\
         tournament_name,\
         tournament_id)\
	VALUES (?,?,?,?,?,?,?,?,?)';

var queryMatchStartDay = 'SELECT scheduled_start_day FROM match WHERE match_id = ?';
var queryDeleteMatchFromUpcomming = 'DELETE FROM upcoming_matches WHERE scheduled_start_day = ? AND match_id = ?';
//var queryGetWriteTime = 'SELECT WRITETIME(tournament_id) FROM upcomming_matches';
//WHERE scheduled_start_day = ? \
//AND match_id = ?';

/*
 * Handling update of match date. 
 * If there exists a match but the date is different we delete the match before updating.
 */
function DelMatchIfExists(match, callback) {
    client.execute(queryMatchStartDay, [match.match_id], {
        prepare: true
    }, function(err, result) {
        if (err) {
            console.error('Upcomming_matches model: Remove match if exists error: . ' + err);
            callback(err);
        } else {
            if (result.rows.length > 0) {
                var params = [result.rows[0].scheduled_start_day,
                    match.match_id
                ];
                client.execute(queryDeleteMatchFromUpcomming, params, {
                    prepare: true,
                    timestamp : new Date(match.updated).getTime()
                }, function(err, result1) {
                    if (err) {
                        console.error('Upcomming_matches model: Remove match error: ' + err);
                    } else {
                        callback();
                    }
                });
            } else {
                callback();
            }
        }
    });
}

function updateMatch(match, callback) {
    var params = [new Date(match.scheduled_start_day).getTime(),
        match.match_id,
        match.away,
        match.country,
        match.home,
        match.name,
        new Date(match.scheduled_start).getTime(),
        match.tournament_name,
        match.tournament_id,
    ];
    DelMatchIfExists(match, function() {
        client.execute(query, params, {
            prepare: true,
            timestamp: new Date(match.updated).getTime()
        }, function(err, result) {
            if (err) {
                console.error(err);
                console.error(new Date(match.scheduled_start).getTime() + ' ' + new Date().getTime());
                callback(err);
            } else {
                console.log('updated match in upcomming_matches ' + match.match_id + result);
                callback();
            }
        });
    });
}

module.exports.updateMatch = updateMatch;
