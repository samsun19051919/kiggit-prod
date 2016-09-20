'use strict';

var self;
var tools = require('../tools');
var log = tools.logger;
var util = require('util');
var events = require('events');
var client = require('../database/dbClient').init();
var async = require('async');
var request = require('request');


var adyen_payment_request = {
    auth: {
        'user': config.kiggit.adyen.auth.payment.user,
        'pass': config.kiggit.adyen.auth.payment.pass
    },
    json: {}
};

var adyen_payout_request = {
    auth: {
        'user': config.kiggit.adyen.auth.payout.user,
        'pass': config.kiggit.adyen.auth.payout.pass
    },
    json: {}
};

function Controller() {
    self = this;

    this.addCreditCard = function (_request, callback) {
        adyen_payment_request.json = _request;
        request.post(config.kiggit.adyen.urls.authorise, adyen_payment_request
            , function (err, httpResponse, body) {
                if (err) {
                    log.error(err.toString());
                    return callback(err);
                }
                if (httpResponse.statusCode === 200) {
                    return callback(null, {statusCode: 200, body: body});
                }
                else {
                    return callback(err, {
                        statusCode: httpResponse.statusCode,
                        errMessage: httpResponse.statusMessage,
                        errBody: body
                    });
                }
            });
    };

    this.deposit = function (_request, callback) {
        adyen_payment_request.json = _request;
        request.post(config.kiggit.adyen.urls.authorise, adyen_payment_request
            , function (err, httpResponse, body) {
                if (err) {
                    log.error(err.toString());
                    return callback(err);
                }
                if (httpResponse.statusCode === 200) {
                    return callback(null, {statusCode: 200, body: body});
                }
                else {
                    return callback(err, {
                        statusCode: httpResponse.statusCode,
                        errMessage: httpResponse.statusMessage,
                        errBody: body
                    });
                }
            });
    };

    this.withdraw = function (_request, callback) {
        adyen_payout_request.json = _request;
        request.post(config.kiggit.adyen.urls.payout, adyen_payout_request
            , function (err, httpResponse, body) {
                if (err) {
                    log.error(err.toString());
                    return callback(err);
                }
                if (httpResponse.statusCode === 200) {
                    return callback(null, {statusCode: 200, body: body});
                }
                else {
                    return callback(err, {
                        statusCode: httpResponse.statusCode,
                        errMessage: httpResponse.statusMessage,
                        errBody: body
                    });
                }
            });
    };

    this.retrieveCCs = function (_request, callback) {
        adyen_payment_request.json = _request;
        request.post(config.kiggit.adyen.urls.retrieve, adyen_payment_request
            , function (err, httpResponse, body) {
                if (err) {
                    log.error(err.toString());
                    return callback(err);
                }
                if (httpResponse.statusCode === 200) {
                    return callback(null, {statusCode: 200, body: body});
                }
                else {
                    return callback(err, {
                        statusCode: httpResponse.statusCode,
                        errMessage: httpResponse.statusMessage,
                        errBody: body
                    });
                }
            });
    };

    this.disableCCs = function (_request, callback) {
        adyen_payment_request.json = _request;
        request.post(config.kiggit.adyen.urls.disable, adyen_payment_request
            , function (err, httpResponse, body) {
                if (err) {
                    log.error(err.toString());
                    return callback(err);
                }
                if (httpResponse.statusCode === 200) {
                    return callback(null, {statusCode: 200, body: body});
                }
                else {
                    return callback(err, {
                        statusCode: httpResponse.statusCode,
                        errMessage: httpResponse.statusMessage,
                        errBody: body
                    });
                }
            });
    };

};


util.inherits(Controller, events.EventEmitter);
module.exports = new Controller();