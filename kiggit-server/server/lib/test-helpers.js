'use strict';

var konfig     = require('../konfig');
var fs         = require('fs');
var tools      = require('./tools');
var async      = require('async');

console.log('NOTICE: Make sure that at some point in the life of your cassandra installation\n        you have run "make test-scaffold", or any test will fail horribly!');





/**
 * "Web Socket" objects for testing and using basic WS access, one unathorized, one authorized.
 *
 * @return {object} Dummy web socket
 */
module.exports.getUnauthorizedFakeWebSocket = function () {
    /* Very crude version of the web socket object we'd otherwise have in the responder. */
    return {
        /* We don't emit, but we don't want the server to fail ;) */
        emit: function() {},
        /* Fake a Danish IP address coming in through the nginx load balancer */
        upgradeReq: { headers: { 'x-real-ip': '109.57.153.51' }}
    };
}
module.exports.getAuthorizedFakeWebSocket = function (id, name, createdAt) {
    var socket    = module.exports.getUnauthorizedFakeWebSocket();
    socket.client = {
        user : {
            id        : id        || 1,
            name      : name      || 'Fake',
            createdAt : createdAt || new Date()
        },
        installation : {
            type : 'iOS',
            id   : 'TEST'
        }
    };
    return socket;

};
