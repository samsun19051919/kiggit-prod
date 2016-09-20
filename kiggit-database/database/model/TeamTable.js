/*
 * Contains teams with list of players on the team
 */

var query = "CREATE TABLE teams (" +
    "gender text," +
    "name text," +
    "id int," +
    "players list<text>," +
    "PRIMARY KEY (name, id)" +
    ") WITH " +
    "COMPACTION = { 'class': 'LeveledCompactionStrategy' } AND " +
    "GC_GRACE_SECONDS = 864000";

var create = function (client, callback) {
    client.execute(query, function (err, result) {
        if (err) {
            console.log(err);
        } else {
            console.log(query);
        }
        /*client.execute(query1, function (err, result) {
            if (err) {
                console.log(err);
            } else {
                console.log(query1);
            }
            callback();
        });*/
        callback();
    });
};
module.exports.create = create;

