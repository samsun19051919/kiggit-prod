'use strict';

var TimerUtil = require('./TimerUtil');
var Logger = require('./Logger');
//var LoginController = require('../controllers/LoginController');
var tools               = require('../lib/tools');
var Uuid                = require('node-uuid');
var method = RequestHandler.prototype;
//var loginController;

function RequestHandler() {
    //loginController = new LoginController();
    if (!(this instanceof RequestHandler)) {
        return new RequestHandler();
    }
}

method.handle = function (call, req, res, next) {
    var uuid = Uuid.v4();
    Logger.debug(uuid + " request : " + req);
    TimerUtil.start(uuid, req.method + ':' + req.url, function () {
        call(req, res, function () {
            next();
            TimerUtil.stop(uuid, req.method + ':' + req.url, function () {
                Logger.debug(uuid + " response : " + res);
            });
        });
    });
};

/*method.handleWithAuth = function (call, req, res, next) {
    try {
        loginController.isAuthJwt(req, res, function () {
            method.handle(call, req, res, next);
        });
    } catch (ex) {
        res.send(401);
        next();
        throw ex;
    }
};*/

module.exports = new RequestHandler();
