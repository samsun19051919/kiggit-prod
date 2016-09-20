'use strict';
global.config = require('konfig')({
	path: './config'
});

//var should = require('should');
var upcomming_matches = require('./model/upcomming_matches_test.js');
var matches = require('./model/match_test.js');
var results = require('./model/results_test.js');
var fs = require('fs-extra');
var sleep = require('sleep');

var testFiles = '/www/test/testFiles/';
var xmlfiles = '/xmlfiles/notParsed/';
var test1 = 'test_simple_Tournament1';

var test2 = 'test_simple_Tournament_filtered';
var test3 = 'test_multiple_matches';
var test4 = 'test_garbage';
var test5 = 'test_livescore';
var test6 = 'test_simple_Tournament2';
var test7 = 'test_oldtimestamp';
var test8 = 'test_simple_Tournament_with_result';
var test9 = 'test_simple_Tournament_with_result_filtered';
var test10 = 'test_simple_update_match_date';

var testFile1 = testFiles + test1;
var testFile2 = testFiles + test2;
var testFile3 = testFiles + test3;
var testFile4 = testFiles + test4;
var testFile5 = testFiles + test5;
var testFile6 = testFiles + test6;
var testFile7 = testFiles + test7;
var testFile8 = testFiles + test8;
var testFile9 = testFiles + test9;
var testFile10 = testFiles + test10;

var newFile1 = xmlfiles + test1;
var newFile2 = xmlfiles + test2;
var newFile3 = xmlfiles + test3;
var newFile4 = xmlfiles + test4;
var newFile5 = xmlfiles + test5;
var newFile6 = xmlfiles + test6;
var newFile7 = xmlfiles + test7;
var newFile8 = xmlfiles + test8;
var newFile9 = xmlfiles + test9;
var newFile10 = xmlfiles + test10;


describe('upcomming matches', function() {
	this.timeout(8000);
	beforeEach(function(done) {
		matches.truncate(function() {
			upcomming_matches.truncate(function() {
				done();
			});
		});
	});
	after(function(done) {
		done();

	});
	
	it('should have specific match in db after parsing', function(done) {
		upcomming_matches.countMatches(function(result) {
			result.should.equal('0');
			fs.copySync(testFile1, newFile1);
			sleep.usleep(600000);
			upcomming_matches.getMatch(function(result) {
				var expectedResult = {
					scheduled_start_day: 'Wed Aug 05 2015 00:00:00 GMT+0000 (UTC)',
					match_id: 1234567,
					away: 'Frontend Team',
					country: 'Denmark',
					home: 'Backend Team',
					name: 'Backend Team - Frontend Team',
					scheduled_start: 'Wed Aug 05 2015 17:30:00 GMT+0000 (UTC)',
					tournament_id: 18356,
					tournament_name: 'Kiggit League'
				};
				expectedResult.scheduled_start_day.should.equal(result.rows[0].scheduled_start_day + '');
				expectedResult.match_id.should.equal(result.rows[0].match_id);
				expectedResult.away.should.equal(result.rows[0].away);
				expectedResult.country.should.equal(result.rows[0].country);
				expectedResult.home.should.equal(result.rows[0].home);
				expectedResult.name.should.equal(result.rows[0].name);
				expectedResult.scheduled_start.should.equal(result.rows[0].scheduled_start + '');
				expectedResult.tournament_id.should.equal(result.rows[0].tournament_id);
				expectedResult.tournament_name.should.equal(result.rows[0].tournament_name);
				done();
			});
		});
	});
	it('should have 1 match in db after parsing', function(done) {
		upcomming_matches.countMatches(function(result) {
			result.should.equal('0');
			fs.copySync(testFile6, newFile6);
	        sleep.usleep(30000);
			upcomming_matches.countMatches(function(result) {
				result.should.equal('1');
				done();
			});
		});
	});
	it('should have 1 match in db after parsing', function(done) {
		upcomming_matches.countMatches(function(result) {
			result.should.equal('0');
			fs.copySync(testFile1, newFile1);
			sleep.usleep(30000);
			upcomming_matches.countMatches(function(result) {
				result.should.equal('1');
				done();

			});
		});
	});
	it('should have 1 match in db after updating the date', function(done) {
		upcomming_matches.countMatches(function(result) {
			result.should.equal('0');
			fs.copySync(testFile6, newFile6);
			sleep.usleep(30000);
			fs.copySync(testFile10, newFile10);
	        sleep.usleep(30000);
			upcomming_matches.countMatches(function(result) {
				result.should.equal('1');
				done();
			});
		});
	});
	it('should have 0 match in db after parsing non interesting match', function(done) {
		fs.copySync(testFile2, newFile2);
		sleep.usleep(40000);
		upcomming_matches.countMatches(function(result) {
			result.should.equal('0');
			done();

		});
	});

	it('should have 12 matches in db after parsing multiple matches', function(done) {
		fs.copySync(testFile3, newFile3);
		sleep.usleep(1400000);
		upcomming_matches.countMatches(function(result) {
			result.should.equal('12');
			done();
		});
	});
	it('should not crash when receiving carbage', function(done) {
		fs.copySync(testFile4, newFile4);
		sleep.usleep(30000);
		fs.copySync(testFile1, newFile1);
		sleep.usleep(20000);
		upcomming_matches.countMatches(function(result) {
			result.should.equal('1');
			done();

		});
	});
	it('should not crash when receiving livescore', function(done) {
		fs.copySync(testFile5, newFile5);
		sleep.usleep(6000);
		fs.copySync(testFile1, newFile1);
		sleep.usleep(20000);
		upcomming_matches.countMatches(function(result) {
			result.should.equal('1');
			done();
		});
	});
	it('should not update upcomming match when timpestamp in feed is older than the database entry', function(done) {
		var expectedResult = {
			scheduled_start_day: 'Wed Aug 05 2015 00:00:00 GMT+0000 (UTC)',
			match_id: 1234567,
			away: 'Frontend Team',
			country: 'Denmark',
			home: 'Backend Team',
			name: 'Backend Team - Frontend Team',
			scheduled_start: 'Wed Aug 05 2015 17:30:00 GMT+0000 (UTC)',
			tournament_id: 18356,
			tournament_name: 'Kiggit League'
		};
		upcomming_matches.countMatches(function(result) {
			result.should.equal('0');
			fs.copySync(testFile1, newFile1);
			sleep.usleep(30000);
			upcomming_matches.countMatches(function(result) {
				result.should.equal('1');
				upcomming_matches.getMatch(function(result) {
					expectedResult.scheduled_start_day.should.equal(result.rows[0].scheduled_start_day + '');
					expectedResult.match_id.should.equal(result.rows[0].match_id);
					expectedResult.away.should.equal(result.rows[0].away);
					expectedResult.country.should.equal(result.rows[0].country);
					expectedResult.home.should.equal(result.rows[0].home);
					expectedResult.name.should.equal(result.rows[0].name);
					expectedResult.scheduled_start.should.equal(result.rows[0].scheduled_start + '');
					expectedResult.tournament_id.should.equal(result.rows[0].tournament_id);
					expectedResult.tournament_name.should.equal(result.rows[0].tournament_name);
					fs.copySync(testFile7, newFile7);
					sleep.usleep(40000);
					upcomming_matches.getMatch(function(result) {
						expectedResult.scheduled_start_day.should.equal(result.rows[0].scheduled_start_day + '');
						expectedResult.match_id.should.equal(result.rows[0].match_id);
						expectedResult.away.should.equal(result.rows[0].away);
						expectedResult.country.should.equal(result.rows[0].country);
						expectedResult.home.should.equal(result.rows[0].home);
						expectedResult.name.should.equal(result.rows[0].name);
						expectedResult.scheduled_start.should.equal(result.rows[0].scheduled_start + '');
						expectedResult.tournament_id.should.equal(result.rows[0].tournament_id);
						expectedResult.tournament_name.should.equal(result.rows[0].tournament_name);
						done();

					});
				});
			});
		});
	});

});

describe('Matches', function() {
	this.timeout(10000);
	beforeEach(function(done) {
		matches.truncate(function() {
			upcomming_matches.truncate(function() {
				results.truncate(function() {
					done();

				});
			});
		});
	});
	after(function(done) {
		done();
	});
	it('should have 1 match in db after parsing', function(done) {
		matches.countMatches(function(result) {
			result.should.equal('0');
			fs.copySync(testFile1, newFile1);
			sleep.usleep(100000);
			matches.countMatches(function(result) {
				result.should.equal('1');
				done();

			});
		});
	});
	it('should have 0 match in db after parsing non interesting match', function(done) {
		fs.copySync(testFile2, newFile2);
		sleep.usleep(50000);
		matches.countMatches(function(result) {
			result.should.equal('0');
			done();

		});
	});
	it('should have 12 matches in db after parsing multiple matches', function(done) {
		fs.copySync(testFile3, newFile3);
		sleep.usleep(120000);
		matches.countMatches(function(result) {
			result.should.equal('12');
			done();

		});
	});
	it('should not crash when receiving carbage', function(done) {
		sleep.usleep(10000);
		fs.copySync(testFile4, newFile4);
		sleep.usleep(10000);
		fs.copySync(testFile1, newFile1);
		sleep.usleep(20000);
		matches.countMatches(function(result) {
			result.should.equal('1');
			done();

		});
	});
	it('should not update upcomming match when timpestamp in feed is older than the database entry', function(done) {
		var expectedResult = {
			match_id: 1234567,
			away: 'Frontend Team',
			country: 'Denmark',
			home: 'Backend Team',
			name: 'Backend Team - Frontend Team',
			start_time: 'Wed Aug 05 2015 17:30:00 GMT+0000 (UTC)',
			tournament_name: 'Kiggit League'
		};
		matches.countMatches(function(result) {
			result.should.equal('0');
			fs.copySync(testFile1, newFile1);
			sleep.usleep(20000);
			matches.countMatches(function(result) {
				result.should.equal('1');
				matches.getMatch(function(result) {
					expectedResult.match_id.should.equal(result.rows[0].match_id);
					expectedResult.away.should.equal(result.rows[0].away);
					expectedResult.country.should.equal(result.rows[0].country);
					expectedResult.home.should.equal(result.rows[0].home);
					expectedResult.start_time.should.equal(result.rows[0].start_time + '');
					expectedResult.tournament_name.should.equal(result.rows[0].tournament_name);
					fs.copySync(testFile7, newFile7);
					sleep.usleep(20000);
					matches.getMatch(function(result) {
						expectedResult.match_id.should.equal(result.rows[0].match_id);
						expectedResult.away.should.equal(result.rows[0].away);
						expectedResult.country.should.equal(result.rows[0].country);
						expectedResult.home.should.equal(result.rows[0].home);
						expectedResult.start_time.should.equal(result.rows[0].start_time + '');
						expectedResult.tournament_name.should.equal(result.rows[0].tournament_name);
						done();

					});
				});
			});
		});
	});
});

describe('results', function() {
	this.timeout(50000);
	beforeEach(function(done) {
		matches.truncate(function() {
			upcomming_matches.truncate(function() {
				results.truncate(function() {
					done();

				});
			});
		});
	});
	after(function(done) {
		done();

	});
	it('should have specific result in db after parsing', function(done) {
		results.countResults(function(result) {
			result.should.equal('0');
			fs.copySync(testFile8, newFile8);
			sleep.usleep(50000);
			results.getResult(function(result) {
				var expectedResult = {
					match_id: 1234567,
					goals_home: 1,
					goals_away: 0,
					canceled: 'false',
					postponed: 'false'
				};
				expectedResult.match_id.should.equal(result.rows[0].match_id);
				expectedResult.goals_home.should.equal(result.rows[0].goals_home);
				expectedResult.goals_away.should.equal(result.rows[0].goals_away);
				done();

			});
		});
	});
	it('should have 1 result in db after parsing', function(done) {
		results.countResults(function(result) {
			result.should.equal('0');
			fs.copySync(testFile8, newFile8);
			sleep.usleep(30000);
			results.countResults(function(result) {
				result.should.equal('1');
				done();

			});
		});
	});
	it('should have 0 result in db after parsing non interesting match', function(done) {
		fs.copySync(testFile9, newFile9);
		sleep.usleep(30000);
		results.countResults(function(result) {
			result.should.equal('0');
			done();
		});
	});
});
