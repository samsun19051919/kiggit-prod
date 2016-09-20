'use strict';
var cassandra = require('cassandra-driver');
var client = new cassandra.Client({
    contactPoints: config.kiggit.hosts,
    keyspace: config.kiggit.keyspace
});
var util = require('util');
client.connect(function(err) {
    if (err) {
        console.log("could not connect to cassandra");
    } else {
        console.log("Connected to cassandra");
    }
});

function all(callback) {
    var query = "SELECT * FROM tournaments";
    client.execute(query, {
        prepare: true
    }, function(err, result) {
        if (err) {
            console.error('tournamentsModel: getAll error. ' + err);
            callback(err);
        } else {
            callback(result.rows);
        }
    });
}
function update(tournament, callback) {
    var queryDel = "DELETE FROM tournaments WHERE tournament_id = ?"
    var query = "INSERT INTO tournaments (tournament_id, sortorder, country, tournament_label, tournament_name) " +
                "VALUES (?,?,?,?,?)";
    var params = [
      tournament.tournament_id,
      tournament.sortorder,
      tournament.country,
      tournament.tournament_label,
      tournament.tournament_name
    ];
    client.execute(queryDel, [tournament.tournament_id], {prepare: true}, function (err, result) {
      if(err){
        callback(err);
        return;
      }
      client.execute(query, params, { prepare: true }, function(err, result) {
          if (err) {
              console.error(err);
               callback(err);
              return;
          }
          callback();
      });
    });
}

module.exports.all = all;
module.exports.update = update;