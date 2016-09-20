var helpers = require('../lib/test-helpers');
var responder = require('../lib/ws-responder');
var assert = require('assert');
var tools = require('../lib/tools');
var log = tools.logger;
var uuid = require("node-uuid");

describe('Wallet test', function () {
    this.timeout(5000);

    before(function (done) {
        ws = helpers.getAuthorizedFakeWebSocket(helpers.userId1, helpers.userName1, helpers.userDate1),
            done();
    });
    after(function (done) {
        done();
    });

    describe('Add credit card', function () {

        it('Success', function (done) {
            done();
        });
        it('Error - mandatory fields missing', function (done) {
            done();
        });
        it('Error - unprocessable entity', function (done) {
            done();
        });

    });

    describe('Deposit', function () {
        it('Success', function (done) {
            done();
        });
        it('Error - ', function (done) {
            done();
        });
    });

    describe('Withdraw', function () {
        it('Success', function (done) {
            done();
        });
        it('Error - ', function (done) {
            done();
        });
    });

    describe('Disable', function () {
        it('Success', function (done) {
            done();
        });
        it('Error - mandatory fields missing', function (done) {
            done();
        });
    });


});

