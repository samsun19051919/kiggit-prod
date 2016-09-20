var helpers = require('../lib/test-helpers');
var responder = require('../lib/ws-responder');
var assert = require('assert');

describe('Matches test', function () {
    this.timeout(5000);

    before(function (done) {
        ws = helpers.getAuthorizedFakeWebSocket(helpers.userId1, helpers.userName1, helpers.userDate1),
            done();
    });
    after(function (done) {
        process.exit;
        done();
    });

    describe('Get upcoming matches', function () {
        it('Success', function (done) {
            msg = {
                type: 'request',
                action: 'match:fetchUpcoming',
                id: 1337,
                data: {
                    date: '2016-02-24'
                }
            };
            responder.respond(ws, msg, function (err, res) {
                assert.notEqual(res, null);
                done();

            });
        });
        it('Error - invalid message', function (done) {
            // TODO
            done();
        });
        it('Error - Wrong date', function (done) {
            // TODO
            done();
        });
    });
});
