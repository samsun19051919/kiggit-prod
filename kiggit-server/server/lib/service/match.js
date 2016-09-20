var tools = require('../tools');
var log = tools.logger;
var matchResponder = require('../responder/match');

var method = MatchService.prototype;

function MatchService() {

};

method.fetchUpcoming = function (req, res, callback) {

    var data = req.params;
    if (!data.date) {
        res.send(400, "Rejecting request with insufficient or bad data - required fields [date]");
        res.end();
        return callback(null);
    }
    matchResponder.fetchUpcoming({}, data, function (err, result) {
        if (err) {
            log.error(err.toString());
            res.send(500, err);
            res.end();
            return callback(err);
        }
        res.send(202);
        res.end();
        callback(null);
    });
};

module.exports = MatchService;
