"use strict";
global.config = require('konfig')({
    path: './config'
});

var should = require('should');
var betslip = require('./model/betslip_test.js');
var matches = require('./model/match_test.js');
var results = require('./model/results_test.js');
var misc = require('./model/misc.js');
var fs = require('fs-extra');
var sleep = require('sleep');
var uuid = require("node-uuid");
var child_process = require('child_process');

var errorLogfile = '/www/err.log';
var testFiles = '/www/test/testFiles/';
var xmlfiles = '/xmlfiles/notParsed/';
var test1 = 'test_simple_Tournament1';
var test2 = 'test_simple_Tournament2';
var test3 = 'test_simple_Tournament1_with_result';
var test4 = 'test_simple_Tournament2_with_result';
var test5 = 'test_simple_Tournament3_with_updated_result';
var test6 = 'test_result_for_test_leaderboard';

var testFile1 = testFiles + test1;
var testFile2 = testFiles + test2;
var testFile3 = testFiles + test3;
var testFile4 = testFiles + test4;
var testFile5 = testFiles + test5;
var testFile6 = testFiles + test6;

var newFile1 = xmlfiles + test1;
var newFile2 = xmlfiles + test2;
var newFile3 = xmlfiles + test3;
var newFile4 = xmlfiles + test4;
var newFile5 = xmlfiles + test5;
var newFile6 = xmlfiles + test6;

var betslip_id1 = uuid.v4();

var betslip1 = {
    betslip_id: betslip_id1,
    bet_size: 5,
    status: 'open',
    creator: uuid.v4(),
    created: new Date().getTime(),
    start_time: new Date().getTime()
};
var match1 = {
    match_id: 1234567,
    tournament_name: 'Kiggit League',
    home: 'Backend Team',
    away: 'Frontend Team',
    country: 'Denmark',
    start_time: new Date().getTime()
};
var match2 = {
    match_id: 9062919,
    tournament_name: 'ligue 1',
    home: 'Esperance Tunis',
    away: 'Africain',
    country: 'Tunisia',
    start_time: new Date().getTime()
};
var match3 = {
    match_id: 1111111,
    tournament_name: 'ligue 1',
    home: 'Esperance Tunis',
    away: 'Africain',
    country: 'Tunisia',
    start_time: new Date().getTime()
};
var betslip_id2 = '11111111-1111-1111-1111-111111111111';
describe('resultsHandler', function() {
    this.timeout(70000);
    before(function(done) {
        done();
    });
    beforeEach(function(done) {
        matches.truncate(function() {
            betslip.truncate(function() {
                results.truncate(function() {
   //                 fs.copySync(testFile1, newFile1);
   //                 fs.copySync(testFile2, newFile2);
                    betslip.insertBetslip(betslip1, function() {
                        betslip.insertMatchInBetslip(betslip_id1, match1, function() {
                            betslip.insertMatchInBetslip(betslip_id1, match2, function() {
                                betslip.insertMatchInBetslip(betslip_id2, match3, function() {
                                    done();
                                });
                            });
                        });
                    });
                });
            });
        });
    });
    after(function(done) {
        done();
    });
    it('should not do anything as betslip is not resolved', function(done) {
        fs.copySync(testFile3, newFile3);
        sleep.usleep(10000);
        betslip.get(betslip_id1, function(result) {
            (result.rows[0].betslip_id + '').should.equal(betslip_id1);
            result.rows[0].bet_size.should.equal(5);
            result.rows[0].status.should.equal('open');
            done();
        });
    });
    it('should change status to settled in betslip table and add betslip to settled betslips table', function(done) {
        fs.copySync(testFile4, newFile4);
        fs.copySync(testFile3, newFile3);
        sleep.usleep(200000);
        betslip.get(betslip_id1, function(result) {
            result.rows[0].status.should.equal('settled');
            result.rows[0].settle_time.should.be.approximately(new Date().getTime(), 1000);
            betslip.getSettled(betslip_id1, function(result) {
                result.rows[0].settled_time.should.be.approximately(new Date().getTime(), 1000);
                result.rows[0].resolved.should.equal(false);
                done();
            });
        });
    });
    it('should produce a warning if an updated result arrives for a betslip that has been resolved', function(done) {
        fs.copySync(testFile4, newFile4);
        fs.copySync(testFile3, newFile3);
        sleep.usleep(250000);
        betslip.getSettled(betslip_id1, function(result) {
            result.rows[0].resolved.should.equal(false);
            betslip.updateResolved(betslip_id1, true, function() {
                betslip.getSettled(betslip_id1, function(result) {
                    result.rows[0].resolved.should.equal(true);
                    fs.copySync(testFile5, newFile5);
                    sleep.usleep(10000);
                    fs.readFile(errorLogfile, 'utf8', function(err, errorLog) {
                        if (errorLog.indexOf('Warning:') > -1) {
                            done();
                        } else {
                            sleep.usleep(40000);
                            fs.readFile(errorLogfile, 'utf8', function(err, errorLog) {
                                (errorLog.indexOf('Warning:') > -1).should.equal(true);
                            });
                            done();
                        }

                    });

                });
            });
        });
    });

    it('should update betslip_leaderboard when a new result arrives', function(done) {
        fs.copySync(testFile6, newFile6);
        sleep.sleep(10);
        misc.getBetslipLeaderboard(betslip_id2, function(result) {
                result.rows[0].user_score.should.equal(1);
                result.rows[1].user_score.should.equal(0);
                result.rows[2].user_score.should.equal(0);
                //console.log(result, false, null);
                done();
        });
    });
});
