var query2 = "CREATE TABLE migrations (" +
    "       id      text, " +
    "       name    text, " +
    "       created timestamp, " +
    "       PRIMARY KEY (id))";


var create = function (client, callback) {
    client.execute(query2, function (err, result) {
        if (err) {
            console.log(err);
        } else {
            console.log(query2);
            callback();
        }
    });
};

module.exports.create = create;
