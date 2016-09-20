/**
 * Created by jn on 15-02-2015.
 */
var winston = require('winston');
var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({level: config.kiggit.log_level}),
/*        new (require('winston-daily-rotate-file'))({
            filename: config.kiggit.log_file,
            level: config.kiggit.log_level,
            colorize: true})*/
    ]
});

function Logger() {
    if (!(this instanceof Logger)) {
        return new Logger();
    }
}

Logger.prototype.log = function (message) {
    logger.info(message);
};

Logger.prototype.info = function (message) {
    logger.info(message);
};

Logger.prototype.warn = function (message) {
    logger.warn(message);
};

Logger.prototype.debug = function (message) {
    logger.debug(message);
};

Logger.prototype.trace = function (message) {
    logger.trace(message);
};

Logger.prototype.error = function (message) {
    logger.error(message);
    logger.error('Stacktrace (The first line is always from the Logger.js) : ' + new Error().stack);
};

module.exports = new Logger();
