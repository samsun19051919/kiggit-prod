'use strict';

var HashMap = require('hashmap').HashMap;
var map = new HashMap();
var tools               = require('../lib/tools');
var Logger = require('./Logger');
var method = TimerUtil.prototype;

function TimerUtil() {
    if (!(this instanceof TimerUtil)) {
        return new TimerUtil();
    }
}

method.start = function (uuid, servicename, callback) {
    Logger.info("Start: " + servicename + " " + uuid);
    map.set(uuid, new Date().getTime());
    callback();
};

method.stop = function (uuid, servicename, callback) {
    var startTime = map.get(uuid);
    Logger.info("Stop: " + servicename + " " + uuid + " time : " + (new Date().getTime() - startTime) + " ms");
    map.remove(uuid);
    callback();
};

module.exports = new TimerUtil();
