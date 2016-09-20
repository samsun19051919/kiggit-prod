"use strict";
global.config = require('konfig')({
    path: './config'
});

var async = require('async');
var should = require('should');
var util = require('util');
var betslip = require('./model/betslip_test.js');
var matches = require('./model/match_test.js');
var results = require('./model/results_test.js');
var misc = require('./model/misc.js');
var user = require('./model/user_test.js');
var load = require('./model/load_test.js');

var fse = require('fs-extra');
var sleep = require('sleep');
var uuid = require("node-uuid");
var errorLogfile = '/www/err.log';
var data = '/www/test/testFiles/data/';
var async = require('async');
var child_process = require('child_process');

var betslips = [{
    betslip_id: '11111111-1111-1111-1111-111111111111',
    bet_size: 2000,
    created: '2016-05-17 17:57:21+0000',
    creator: '00000000-0000-0000-0000-111111111111',
    settle_time: '2016-05-17 19:00:00+0000',
    start_time: '2016-05-17 19:00:00+0000',
    status: 'settled',
    user_idkiggit: '11111111-1111-1111-1111-111111111111',
    user_id1: '00000000-0000-0000-0000-111111111111',
    user_id2: '00000000-0000-0000-0000-222222222222',
    user_id3: '00000000-0000-0000-0000-333333333333'
},
{
    betslip_id: '11111111-1111-1111-1111-111111111112',
    bet_size: 2000,
    created: '2016-05-17 17:57:21+0000',
    creator: '00000000-0000-0000-0000-111111111111',
    settle_time: '2016-05-17 19:00:00+0000',
    start_time: '2016-05-17 19:00:00+0000',
    status: 'settled',
    user_idkiggit: '11111111-1111-1111-1111-111111111112',
    user_id1: '00000000-0000-0000-0000-111111111111',
    user_id2: '00000000-0000-0000-0000-222222222222',
    user_id3: '00000000-0000-0000-0000-333333333333'
}];

describe('Spark-payout integration test', function() {
    this.timeout(47000);
    before(function(done) {
        child_process.execFile('/www/test/test/schema/load_tables.sh', [config.kiggit.hosts], (error, stdout, stderr) => {
            if (error) {
                throw error;
            }
            //console.log(stdout);
            done();
        });

    });
    beforeEach(function(done) {
        done();
    });

    after(function(done) {
        done();
    });
    it('should not do anything as betslip is not setlled', function(done) {
        var sparkCommand = '/www/spark-1.6.1-bin-hadoop2.6/bin/spark-submit --packages datastax:spark-cassandra-connector:1.6.0-s_2.10 --master local /www/spark-payout/simpleCApp/target/scala-2.10/simple-project_2.10-1.0.jar ' + config.kiggit.hosts[0] + ' ' + config.kiggit.keyspace;
        child_process.exec(sparkCommand, [config.kiggit.hosts[0]], (error, stdout, stderr) => {
            if (error) {
                throw error;
            }
            betslip.get(betslips[0].betslip_id, function(result) {
                result.rows[0].status.should.equal('started');
                done();
            });
        });
    });
    it('should resolve settled betslip', function(done) {
        var sparkCommand = '/www/spark-1.6.1-bin-hadoop2.6/bin/spark-submit --packages datastax:spark-cassandra-connector:1.6.0-s_2.10 --master local /www/spark-payout/simpleCApp/target/scala-2.10/simple-project_2.10-1.0.jar ' + config.kiggit.hosts[0] + ' ' + config.kiggit.keyspace;
        betslip.insertBetslip(betslips[0], function() {
            child_process.exec(sparkCommand, [config.kiggit.hosts[0]], (error, stdout, stderr) => {
                if (error) {
                    throw error;
                }
                betslip.get(betslips[0].betslip_id, function(result) {
                    result.rows[0].status.should.equal('resolved');
                    //console.log(result.rows, false, null);
                    done();
  
              });
            });
        });
    });
    it('should increment winner 1 money counter', function(done){
        misc.getMoney(betslips[0].user_id1, function(money) {
            //console.log(money, false, null);                            
            money.should.equal('12850');
            //money.should.equal('128.5');
            done();
        });
    });
    it('should not increment loosers money counter', function(done){
        misc.getMoney(betslips[0].user_id2, function(money) {
            //console.log(money, false, null);                            
            money.should.equal('10000');
            done();
        });
    });
    it('should increment winner 2 money counter', function(done){
        misc.getMoney(betslips[0].user_id3, function(money) {
            //console.log(money, false, null);                            
            money.should.equal('12850');
            //money.should.equal('128.5');
            done();
        });
    });
    it('should insert transaction for user 1', function(done){
        misc.getTransaction(betslips[0].user_id1, betslips[0].betslip_id, function(result) {
            //console.log(result);                            
            result.should.equal(2850);
            //result.should.equal(28.5);
            done();
        });
    });
    it('should insert transaction for user 3', function(done){
        misc.getTransaction(betslips[0].user_id3, betslips[0].betslip_id, function(result) {
            //console.log(result);                            
            result.should.equal(2850);
            //result.should.equal(28.5);
            done();
        });
    });
    it('should insert transaction for user kiggit', function(done){
        misc.getTransaction(betslips[0].user_idkiggit, betslips[0].betslip_id, function(result) {
            //console.log(result);                            
            result.should.equal(300);
            done();
        });
    });
    it('should transfer 5% to kiggits money counter', function(done){
        misc.getMoney(betslips[0].user_idkiggit, function(money) {
            //console.log(money, false, null);                            
            money.should.equal('300');
            //money.should.equal('28.5');
            done();
        });
    });
    it('should update table winners', function(done){
        misc.getWinners(betslips[0].betslip_id, function(winners) {
            winners[0].amount.should.equal(2850);
            winners[0].position.should.equal(1);
            winners[1].amount.should.equal(2850);
            winners[1].position.should.equal(1);
            //money.should.equal('128.5');
            done();
        });
    });
    it('should increment the score for all users who participate in the betslip', function(done) {
        user.getFunfacts(function(result) {
            result.rows[0].betslipcounter.toString().should.equal('11');
            result.rows[1].betslipcounter.toString().should.equal('11');
            result.rows[2].betslipcounter.toString().should.equal('11');
            done();
        });
    });
});