var helpers   = require('../lib/test-helpers');
var responder = require('../lib/ws-responder');
var assert = require('assert');

describe('Betslip test', function () {
    this.timeout(5000);

    before(function (done) {
        ws  = helpers.getAuthorizedFakeWebSocket(helpers.userId1, helpers.userName1, helpers.userDate1),
        done();
    });
    after(function (done) {
        process.exit;
        done();
    });

    describe('Create betslip', function () {
        it('Success', function (done) {
            // TODO
            done();
        });
    });

    describe('Fetch betslips', function () {
        it('Success', function (done) {
            // TODO
            done();
        });
        it('Error - no user_id', function (done) {
            // TODO
            done();
        });
    });

    describe('Fetch betslip detail', function () {
        it('Success', function (done) {
            // TODO
            done();
        });
        it('Error - betslip not found', function (done) {
            // TODO
            done();
        });
        it('Error - user not found', function (done) {
            // TODO
            done();
        });
    });

    describe('Join betslips', function () {
        it('Success', function (done) {
            // TODO
            done();
        });
        it('Error - insufficient data', function (done) {
            // TODO
            done();
        });
        it('Error - betslip not found', function (done) {
            // TODO
            done();
        });
        it('Error - betslip can not be joined', function (done) {
            // TODO
            done();
        });
        it('Error - no invitation found', function (done) {
            // TODO
            done();
        });
        it('Error - no invitation found betslip already joined', function (done) {
            // TODO
            done();
        });
    });

    describe('Invite to betslip', function () {
        it('Success', function (done) {
            // TODO
            done();
        });
        it('Error - betslip not found', function (done) {
            // TODO
            done();
        });
        it('Error - inviting user not found', function (done) {
            // TODO
            done();
        });
    });

});