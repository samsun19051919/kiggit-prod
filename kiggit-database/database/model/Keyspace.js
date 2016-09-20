var query = "DROP KEYSPACE IF EXISTS " + config.kiggit.keyspace;
var query1 = "CREATE KEYSPACE " + config.kiggit.keyspace +
	' ' + config.kiggit.replication;

var create = function(client, callback) {
	client.execute(query, function(err, result) {
		if (err) {
			console.log(err);
		} else {
			console.log(query);
		}
		client.execute(query1, function(err, result) {
			if (err) {
				console.log(err);
			} else {
				console.log(query1);
			}
			callback();
		});
	});
};

module.exports.create = create;
