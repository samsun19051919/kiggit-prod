"use strict";
global.config = require('konfig')({
    path: './config'
});

var async = require('async');
var should = require('should');

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
    user_id3: '00000000-0000-0000-0000-333333333333',
    match_id1: '1111111',
    match_id2: '2222222',
    match_id3: '3333333'    
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

describe('Spark-betslip-leaderboard test', function() {
    this.timeout(47000);
    before(function(done) {
        child_process.execFile('/www/test/test/schema/load_tables.sh', [config.kiggit.hosts], (error, stdout, stderr) => {
            if (error) {
                throw error;
            }
            done();
        });
    });
    beforeEach(function(done) {
        done();
    });

    after(function(done) {
        done();
    });
    it('should pupulate the betslip_leaderboard table', function(done) {
        var sparkCommand = '/www/spark-1.6.1-bin-hadoop2.6/bin/spark-submit --packages datastax:spark-cassandra-connector:1.6.0-s_2.10 --master local /www/spark-betslip-leaderboard/simpleCApp/target/scala-2.10/simple-project_2.10-1.0.jar ' + config.kiggit.hosts[0] + ' ' + config.kiggit.keyspace + ' ' + betslips[0].match_id1;
        child_process.exec(sparkCommand, [config.kiggit.hosts[0]], (error, stdout, stderr) => {
            if (error) {
                throw error;
            }
            misc.getBetslipLeaderboard(betslips[0].betslip_id, function(result) {
                result.rows[0].user_score.should.equal(1);
                result.rows[1].user_score.should.equal(0);
                result.rows[2].user_score.should.equal(1);
                done();
            });
        });
    });
});