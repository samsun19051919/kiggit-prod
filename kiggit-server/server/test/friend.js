var helpers = require('../lib/test-helpers');
var responder = require('../lib/ws-responder');
var assert = require('assert');
var tools = require('../lib/tools');
var log = tools.logger;
var uuid = require("node-uuid");

describe('User test', function () {
    this.timeout(5000);

    before(function (done) {
        ws = helpers.getAuthorizedFakeWebSocket(helpers.userId1, helpers.userName1, helpers.userDate1),
            done();
    });
    after(function (done) {
        done();
    });

    describe('Get user_ids from Facebook_Ids', function () {

        it('Success', function (done) {
            done();
        });

        it('Error - mandatory fields missing', function (done) {
            msg = {
                "data":{
                },
                "action":"friend:getUserIdsFromFacebookIds",
                "id":48179122,
                "status":0,
                "type":"request"
            };
            responder.respond(ws, msg, function (err, res) {
                assert.equal(res.status, 400);
                assert.equal(res.errorMsg, 'Rejecting request with insufficient or bad data');
                done();

            });
        });

    });

});
