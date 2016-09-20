var tools = require('../tools');
var betslipResponder = require('../responder/betslip');
var Logger = require('../../util/Logger');
var method = BetslipService.prototype;

function BetslipService() {

};

method.create = function (req, res, callback) {

    var data = req.body.data;
    betslipResponder.create({}, data, function (err, result) {
        if (err) {
            Logger.error(err.toString());
            res.send(500, err);
            res.end();
            return callback(err);
        }
        res.send(201, result);
        res.end();
        return callback(null, result);
    });

};

module.exports = BetslipService;
