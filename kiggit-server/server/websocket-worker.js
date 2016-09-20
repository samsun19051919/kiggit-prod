'use strict';

global.config = require('konfig')({
    path: './config'
});

var Logger = require('./util/Logger');

var responder = require('./lib/ws-responder');
var wss       = require('./lib/ws-wrapper');
var tools     = require('./lib/tools');

Logger.debug('Configuring for ' + config.kiggit.environment);

process.on('uncaughtException', function(err) {
    Logger.error && Logger.error('*** Web socket worker going down ...', err, err.stack);
    tools.shout('Uncaught exception brought down web socket worker', err, process.exit);
});

wss.listen();
