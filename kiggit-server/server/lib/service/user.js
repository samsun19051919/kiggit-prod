var tools = require('../tools');
var log = tools.logger;
var userController = require('../controller/user');

var method = UserService.prototype;

function UserService() {

};

method.uppasswd = function (req, res, callback) {
    log.debug("Service user: " + req);
    var data = req.body;
    if (!data.user_id || !data.password || !data.token) {
        res.send(400, "Rejecting request with insufficient or bad data - required fields [user_id, password, token]");
        res.end();
        return callback(null);
    }
    userController.getByUserId(data.user_id, function (err, res1) {
        if (err) {
            log.error(err.toString());
            res.send(500, err);
            res.end();
            return callback(err);
        }
        if (res1.rows.length === 0) {
            log.debug("User not found");
            res.send(404, "User not found");
            res.end();
            return callback(null);
        }
        if (data.token !== res1.rows[0].password) {
            log.debug("invalid token - try requesting a new one");
            res.send(403, "invalid token - try requesting a new one");
            res.end();
            return callback(null);
        }
        userController.updatePassword(data.user_id, data.password, function (err, result) {
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
    });
};

module.exports = UserService;
