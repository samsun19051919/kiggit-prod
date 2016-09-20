    /*global config*/
    "use strict";
    global.config = require('konfig')({
        path: './config'
    });
    var csv = require('csv-stream');
    var fs = require('fs');
    var cassandra = require('cassandra-driver');
    var authProvider = new cassandra.auth.PlainTextAuthProvider('cassandra', 'cassandra');
    var client = new cassandra.Client({
        contactPoints: [config.kiggit.host],
        keyspace: config.kiggit.keyspace,
        authProvider: authProvider
    });
    var query = 'INSERT INTO tournaments (tournament_id, sortorder, country, tournament_name, tournament_label) VALUES (?,?,?,?,?)';

    var count = 0;
    // populate table tournament
    exports.runMigration = function (callback) {
        let options = {
            delimiter : ';', // default is , 
            endLine : '\n', // default is \n, 
        };
        var csvStream = csv.createStream(options);
        fs.createReadStream('migrations/20160906183201-tournament_data.csv')
        .pipe(csvStream)
        .on('error',function(err){
            console.error("22--",err);
        })
        .on('data',function(data){
            count++;
            client.execute(query, [
                data.id,
                data.sortorder ? data.sortorder : '0',
                data.country,
                data.name,
                data.label
            ], {prepare: true}, function (err) {
                if (err) {
                    console.log('error: ', err);
                    return callback(err);
                }
                
            });
        })
        .on('end', function(){
            setTimeout(function() {
                client.execute('SELECT count(*) FROM tournaments', function (err, result){
                    var dbCount = result.rows[0].count.toInt();
                    if (dbCount === count){
                        callback();
                    }
                });
            }, 2000);
        });
    };