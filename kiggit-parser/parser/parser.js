'use strict';
var xml2js = require('xml2js'),
    betData = require('./lib/parsers/betData.js'),
    secondhalftimetable = require('./lib/parsers/secondhalftimetable.js'),
    halftimetable = require('./lib/parsers/halftimetable.js'),
    playerstatistics = require('./lib/parsers/playerstatistics.js'),
    leaguetable = require('./lib/parsers/leaguetable.js'),
    squad = require('./lib/parsers/squad.js'),
    formtable = require('./lib/parsers/formtable.js');

function parser(xmlString, file, cb) {
    var parser = new xml2js.Parser();
    parser.parseString(xmlString, function(err, result) {
        var type = '';
        if (result !== null &&
            result !== undefined &&
            result.BetradarBetData !== undefined &&
            result.BetradarBetData.Sports !== undefined) {
            type = 'BetData';
        } else if (result !== null &&
            result !== undefined &&
            result.BetradarLivescoreData !== undefined) {
            type = 'BetradarLivescoreData';
        } else {
            type = '';
        }

        switch (type) {
            case 'BetData':
                console.log('BetData');
                betData(result.BetradarBetData, cb);
                break;
            case 'BetradarLivescoreData':
                console.log('BetradarLivescoreData');
                cb();
                break;
            case 'halftimetable':
                console.log('halftimetable');
                halftimetable(result['ns2:SportradarData']);
                cb();
                break;
            case 'secondhalftimetable':
                console.log('secondhalftimetable');
                secondhalftimetable(result['ns2:SportradarData']);
                cb();
                break;
            case 'playerstatistics':
                console.log('playerstatistics');
                playerstatistics(result['ns2:SportradarData']);
                cb();
                break;
            case 'leaguetable':
                console.log('leaguetable');
                leaguetable(result['ns2:SportradarData']);
                cb();
                break;
            case 'squad':
                console.log('squad');
                squad(result['ns2:SportradarData'], cb);
                break;
            case 'formtable':
                console.log('formtable');
                formtable(result['ns2:SportradarData']);
                cb();
                break;
            default:
                console.error("parser.js: xml feed was not recornized");
                cb();
        }
    });
}
module.exports = parser;