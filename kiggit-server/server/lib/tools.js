'use strict';

var util = require('util'),
    konfig = require('../konfig'),
    mailer = require('nodemailer');
var smtpTransport = mailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: config.kiggit.email_user,
        pass: config.kiggit.email_pass
    }
})


/**
 * Given a Date object, or a Date parsable value, return that date, floored to the UTC minute. If date argument is
 * not provided, the current time is used.
 *
 * @param   {mixed}     date    (optional) Date object, something parsable by Date()
 * @return  {Date}              Date object with the given, or current, date floored to the minute
 */
module.exports.dateFlooredToMinute = function (date) {
    var floored = date ? new Date(date) : new Date();
    floored.setUTCSeconds(0);
    floored.setUTCMilliseconds(0);
    return floored;
};


/**
 * Given a Date parsable value, return the UTC date for midnight on that day. If date argument is not provided, the
 * current time is used.
 *
 * @param  {mixed}  date    (optional) Date object, something parsable by Date()
 * @return {Date}           Date object with the given, or current, date floored to midnight on that (UTC) day
 */
module.exports.dateFlooredToMidnight = function (date) {
    var floored = date ? new Date(date) : new Date();
    floored.setUTCHours(0);
    floored.setUTCMinutes(0);
    floored.setUTCSeconds(0);
    floored.setUTCMilliseconds(0);
    return floored;
};


/**
 * Given a Date parsable value, return the date for UTC midnight on the first day of that month. If no argument is
 * provided, the current time is used.
 *
 * @param  {mixed}  date    (optional) Date object, something parsable by Date()
 * @return {Date}           Date object with the given, or current, date floored to midnight on that (UTC) day
 */
module.exports.dateFlooredToMonth = function (date) {
    var floored = date ? new Date(date) : new Date(),
        year = floored.getUTCFullYear(),
        month = floored.getUTCISOMonth();

    return new Date(Date.parse(year + '-' + (month > 9 ? month : '0' + month) + '-01 00:00:00 +0000'));
};


/**
 * Very, very simple email checker.
 *
 * @param  {string} email Guess
 * @return {boolean}      Truthy if happy
 */
module.exports.emailIsValid = function (email) {
    return (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b/i).test(email);
};


/**
 * Hash a password using (native) bcrypt (blowfish algorithm).
 *
 * With 10 salt iterations, it takes about 23 ms to hash a password on an MBA
 * 2013 i7.
 *
 * @param  {string}   pwd      Cleartext to hash
 * @param  {function} callback Callback to receive the hash (or error)
 * @return {void}
 */
module.exports.hashPwd = function (pwd, callback) {
    bcrypt.genSalt(konfig.pwdSaltIterations, function (err, salt) {
        if (err)
            return callback(err);
//        bcrypt.hash(pwd, salt, callback);
    });
};


/**
 * Authenticate a password against a hash
 *
 * @param  {string}   pwd      Cleartext
 * @param  {string}   hash     Hash from previous visit to hashPwd
 * @param  {function} callback Callback function to receive a boolean (or error)
 * @return {void}
 */
module.exports.comparePwd = function (pwd, hash, callback) {
//    bcrypt.compare(pwd, hash, callback);
    return callback(null, pwd === hash);
};


/* Set up the logger according to the requested (or default) logging level */
module.exports.logger = {};
switch (konfig.logLevel) {
    case 'debug':
        module.exports.logger.debug = function () {
            process.stdout.write('[' + new Date().toISOString() + '][DEBUG] ');
            console.info.apply(console, arguments);
        };
        break;
    case 'info':
        module.exports.logger.info = function () {
            process.stdout.write('[' + new Date().toISOString() + '][INFO] ');
            console.info.apply(console, arguments);
        };
        break;
    case 'warn':
        module.exports.logger.warn = function () {
            process.stderr.write('[' + new Date().toISOString() + '][WARN] ');
            console.warn.apply(console, arguments);
        };
        break;
    case 'error':
        module.exports.logger.error = function () {
            process.stderr.write('[' + new Date().toISOString() + '][ERROR] ');
            console.error.apply(console, arguments);
        };
        break;
    default:
        break;
}


/**
 * Changes the logger. The default is not to log via console as obvious from the above piece of code.
 *
 * If a function is provided, this function will be called with the type of logging event as first argument
 * (info|warn|error|debug). All events are sent.
 *
 * If an object is provided, it must expose at least an .info method. Logging is only performed for the methods
 * that are exposed on this object (.info|.warn|.error|.debug). Think console object plus debug, and expand on
 * that.
 *
 * Also note that using a function is significantly slower than using an object (overhead of adding the error type
 * to arguments list and indiscriminate logging).
 *
 * @param {mixed} l Logger function or object
 */
module.exports.setLogger = function (l) {

    if (typeof l === 'function') {

        var plusArguments = function (plus, moArgs) {
            var args = [plus];
            for (var i = 0; i < moArgs.length; ++i)
                args[i + 1] = moArgs[i];
            return args;
        };

        module.exports.logger = {
            error: function () {
                l.apply(null, plusArguments('error', arguments));
            },
            warn: function () {
                l.apply(null, plusArguments('warn', arguments));
            },
            info: function () {
                l.apply(null, plusArguments('info', arguments));
            },
            debug: function () {
                l.apply(null, plusArguments('debug', arguments));
            }
        };

    } else if (typeof l === 'object')
        module.exports.logger = l;
    else
        throw new Error('Invalid logger provided. Must be a function or an object!');
};


/**
 * Extend String with a .format member function, which makes it possible to do
 *   "Hello, {0} and {1}! Wait - not {0}!".format('Johnny', 'Lonnie');
 */
if (!String.prototype.format) {
    Object.defineProperty(String.prototype, 'format', {
        enumerable: false,
        writable: true,
        value: function () {
            var args = arguments;
            return this.replace(/\{(\d+)\}/g, function (match, number) {
                return args[number];
            });
        }
    });
}


/**
 * Extend Number with a .getOrdinal member function, returning their values as ordinal strings.
 */
if (!Number.prototype.getOrdinal) {
    var ordinalSuffices = ['th', 'st', 'nd', 'rd'];
    Object.defineProperty(Number.prototype, 'getOrdinal', {
        enumerable: false,
        writable: true,
        value: function () {
            var v = this % 100;
            return this + (ordinalSuffices[(v - 20) % 10] || ordinalSuffices[v] || ordinalSuffices[0]);
        }
    });
}


/**
 * Extend Object with a simple clone method. Emphasis on SIMPLE! This will deep clone all simple types supported by
 * JSON, but also strip out stuff like functions and call .toString() on Objects (e.g. Dates will become datestrings).
 *
 * Also, if you pass along other object(s), all properties on those objects will be merged in sequence on top of the
 * intially cloned object (same restrictions apply - only simple types, and no references).
 */
if (!Object.prototype.clone) {
    Object.defineProperty(Object.prototype, 'clone', {
        enumerable: false,
        writable: true,
        value: function () {
            if (arguments.length) {

                var obj = JSON.parse(JSON.stringify(this));

                for (var i = 0, plus; i < arguments.length; ++i) {
                    plus = arguments[i];

                    if (typeof plus === 'object') {
                        plus = JSON.parse(JSON.stringify(plus));

                        for (var key in plus)
                            obj[key] = plus[key];
                    }
                }

                return obj;
            }

            return JSON.parse(JSON.stringify(this));
        }
    });
}


/**
 * Converts "under_scored" and "under, scored!" type strings to camelized ones.
 * Only a-z, A-Z and 0-9 make the cut in regular strings.
 *
 * "UNDER_SCORED" ones are left as-is, assuming they're constants (though
 * prefixing and trailing underscores are removed, and multiple consecutive
 * underscores are replaced by single ones).
 *
 * Examples:
 *     camel case               => camelCase
 *     Camel Case               => camelCase
 *     camel, Case!?            => camelCase
 *     CamelCase                => camelCase
 *     camel Case case    CASE  => camelCaseCaseCASE
 *     CAMEL_CASE               => CAMEL_CASE
 *     camel_case               => camelCase
 *     Camel_case_Case_case     => camelCaseCaseCase
 *     camel_CASE               => camelCASE
 *     _camelCASE               => camelCASE
 *     _camel_case_             => camelCase
 *     CAMEL____CASE !!!        => CAMEL_CASE
 *
 * This function can also be used directly on an array using foreach, e.g.
 *     funnyStrings.foreach(camelisanitize); // Modifies the elements in-place
 *
 * @param  {String} str String to convert
 * @return {String}     The camelcased, sanitized output
 */
module.exports.camelisanitize = function (str, i, arr) {
    str = str.replace(/[^a-zA-Z0-9_]+/g, '_').replace(/(^_+)|(_+$)/g, '').replace(/__+/, '_');

    /* Leave CONSTANT_CASE as-is */
    if (!str.match(/^[A-Z0-9_]+$/)) {

        str = str.replace(/([^a-zA-Z0-9]+)([a-zA-Z0-9]+)?/g, function (match, g1, g2) {
            return g2 ? g2.charAt(0).toUpperCase() + g2.slice(1) : '';
        });

        str = str.charAt(0).toLowerCase() + str.slice(1);
    }

    /* If called via forEach, modify the array in place, otherwise return the value */
    if (typeof i === 'number' && arr instanceof Array) {
        arr[i] = str;
        return true;
    }

    return str;
};


/**
 * Extend the JS Date object with methods that return the week number for the
 * date it represents, locally and in the UTC timezone.
 *
 * Also add ISO 8601 versions for the Day getters, where Sunday is day 7, not 0.
 *
 * Similarly, add .getUTCISOMonth where January is 1, not 0.
 *
 * .getWeek based on Nick Baicoianu's @ http://www.meanfreepath.com.
 *
 * @param   {int}   dowOffset   The day a weeks begin on in your choice of
 *                              locale. The default is 1, or Monday. Sunday's 0.
 * @return  {int}               ISO 8601 week number.
 */
if (!Date.prototype.getWeek) {
    Object.defineProperty(Date.prototype, 'getWeek', {
        enumerable: false,
        writable: false,
        value: function (dowOffset) {
            dowOffset = typeof dowOffset === 'number' ? dowOffset : 1;
            var newYear = new Date(this.getFullYear(), 0, 1);
            var day = newYear.getDay() - dowOffset;
            day = (day >= 0 ? day : day + 7);
            var daynum = Math.floor((this.getTime() - newYear.getTime() - (this.getTimezoneOffset() - newYear.getTimezoneOffset()) * 60000) / 86400000) + 1;
            var weeknum;
            // if the year starts before the middle of a week
            if (day < 4) {
                weeknum = Math.floor((daynum + day - 1) / 7) + 1;
                if (weeknum > 52) {
                    var nYear = new Date(this.getFullYear() + 1, 0, 1);
                    var nday = nYear.getDay() - dowOffset;
                    nday = nday >= 0 ? nday : nday + 7;
                    weeknum = nday < 4 ? 1 : 53; // if next year starts before the middle of the week, it's week #1 that year
                }
            } else {
                weeknum = Math.floor((daynum + day - 1) / 7);
            }
            return weeknum;
        }
    });
}
if (!Date.prototype.getUTCWeek) {
    Object.defineProperty(Date.prototype, 'getUTCWeek', {
        enumerable: false,
        writable: false,
        value: function (dowOffset) {
            var dt = new Date(this.getTime() + this.getTimezoneOffset() * 60000);
            return dt.getWeek();
        }
    });
}
if (!Date.prototype.getISODay) {
    Object.defineProperty(Date.prototype, 'getISODay', {
        enumerable: false,
        writable: false,
        value: function (dowOffset) {
            var day = this.getDay();
            return day ? day : 7;
        }
    });
}
if (!Date.prototype.getUTCISODay) {
    Object.defineProperty(Date.prototype, 'getUTCISODay', {
        enumerable: false,
        writable: false,
        value: function (dowOffset) {
            var day = this.getUTCDay();
            return day ? day : 7;
        }
    });
}
if (!Date.prototype.getUTCISOMonth) {
    Object.defineProperty(Date.prototype, 'getUTCISOMonth', {
        enumerable: false,
        writable: false,
        value: function (dowOffset) {
            return this.getUTCMonth() + 1;
        }
    });
}


/**
 * Reports fatal errors via Sendmail.
 *
 * TODO: Use the error-generated Error objects wisely.
 *
 * First argument should be a descriptive string detailing the incident. It is
 * required.
 *
 * Additional arguments are optional, each of them will be included in the body
 * of the email. If the last argument is a function, it'll be called once the
 * email has been sent.
 *
 * Beware that the callback will be fed with Error object and additional info,
 * so if your callback doesn't support that (such as process.kill), wrap it!
 *
 * @param   {String}        msg     Description of the incident
 * @return  {undefined}     void
 */
module.exports.shout = function (msg) {

    var mail = {
        from: konfig.emailAuthor,
        to: konfig.emailRecipient,
        subject: '[SERVER NOTICE] ' + msg,
        text: ('At {0}:\n\n' +
        'Instance running on port {1} executed as "{2}".\n\n' +
        'Instance environment:\n{3}\n\n' +
        'Additional info:\n\n\n').format(new Date().toISOString(), config.kiggit.port, konfig.commandLine, util.inspect(konfig.instance, false, null))
    };

    /* Inspect every additional argument in the mail body, except for the last one if it's a function (callback) */
    for (var i = 1; i < arguments.length; ++i) {
        if (!(i === arguments.length - 1 && typeof arguments[i] === 'function')) {
            mail.text += util.inspect(arguments[i], false, null) + '\n\n\n\n\n\n\n\n\n';
            try {
                /* In case this is an errory style object, try to get the stack. */
                mail.text += arguments[i].stack;
            } catch (e) {
            }
        }
    }

    var callback = typeof arguments[i - 1] === 'function' ? arguments[i - 1] : null;

    if (konfig.env === 'production')
        return mailer.sendMail(mail, callback);

    console.error('\n\n***** Would have dispatched email *****');
    for (var prop in mail)
        console.error('***** %s', prop, mail[prop]);

    if (typeof callback === 'function')
        callback();
};

module.exports.sendPasswordReset = function (email, user_id, password) {
    var mail = {
        from: config.kiggit.emailAuthor,
        to: email,
        subject: 'Information from Kiggit team',
        text: ('At {0}:\n\n' +
        'You requested a password reset.\n\n' +
        'Follow this link to set a new one\n\n' +
        '{1}{2}').format(new Date().toISOString(), config.kiggit.reset_pass_link, user_id)
    };

    for (var i = 1; i < arguments.length; ++i) {
        /*if (!(i === arguments.length - 1 && typeof arguments[i] === 'function')) {
            mail.text += util.inspect(arguments[i], false, null) + '\n\n\n\n\n\n\n\n\n';
            try {
                mail.text += arguments[i].stack;
            } catch (e) {
            }
        }*/
    }
    var callback = typeof arguments[i - 1] === 'function' ? arguments[i - 1] : null;

    smtpTransport.sendMail(mail, function (err, res) {
        if (err) {
            return callback(err);
        }
        callback(null, res.response);
    });
}
;


module.exports.msToHHMMSS = function (ms) {
    var secs = Math.floor(ms / 1000),
        hours = Math.floor(secs / 3600),
        minutes = Math.floor((secs - (hours * 3600)) / 60),
        seconds = secs - (hours * 3600) - (minutes * 60);

    if (hours < 10) hours = '0' + hours;
    if (minutes < 10) minutes = '0' + minutes;
    if (seconds < 10) seconds = '0' + seconds;

    return hours + ':' + minutes + ':' + seconds;
};

module.exports.getPredictionText = function (prediction_type) {
    switch (prediction_type) {
        case 1:
            return "result"
            break
        case 2:
            return "outcome"
            break
        case 3:
            return "goalscorer"
            break
        default:
            return ""
            break
    }
};