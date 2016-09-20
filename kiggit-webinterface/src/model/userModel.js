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


function updateUser(user, callback) {
    var query = "INSERT INTO admin_users (email, password, userrights) " +
    "VALUES (?,?,?)";
    var params = [user.email,
                 user.hash,
                 user.userrights];
    client.execute(query, params, { prepare: true }, function(err, result) {
        if (err) {
            console.error(err);
            return callback(err);
        }
        callback();
    });
}
function getUser(email, callback) {
    var query = "SELECT * FROM admin_users WHERE email = ?";
    client.execute(query, [email], { prepare: true }, function(err, result) {
        if (err) {
            console.error('getUser error. ' + err + '. email: ' + email );
            callback(err);
        } else {
            callback(result.rows[0]);
        }
    });
}
function all(callback) {
    var query = "SELECT email, userrights FROM admin_users";
    client.execute(query, {prepare: true}, function(err, result) {
        if (err) {
            console.error('usermodel: getAllUser error. ' + err + '. email: ' + email );
            callback(err);
        } else {
            callback(result.rows);
        }
    });
}

module.exports.updateUser = updateUser;
module.exports.getUser = getUser;
module.exports.all = all;

