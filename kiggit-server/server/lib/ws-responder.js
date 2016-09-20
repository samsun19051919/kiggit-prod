/**
 * Web socket responder gate.
 *
 * Forwards messages to the appropriate handlers, makes sure unauthorized requests are denied, and ensures that
 * clients always get a proper response when a handler fails.
 *
 * "Protocol-level" stuff is also handled here, that is, dealing with the message "wrap". Handlers only get the data
 * payload and deal with the actual task at hand.
 */

'use strict';

var konfig = require('../konfig');
var tools = require('./tools');
var util = require('util');
var responder = require('./responder/all');
var userController = require('./controller/user');
var bcrypt = require('bcrypt');
var Logger = require('../util/Logger');
var log = tools.logger;

function WSResponder() {

    var self = this;

    /**
     * Takes a message coming in on a web socket and routes it to the appropriate handler if it meets the most basic
     * criteria.
     *
     * If the socket hasn't been authenticated, requests to anything but user.authenticate or user.create are rejected.
     *
     * @param  {object}     ws          The web socket this message came in on
     * @param  {object}     msg         The parsed message object
     * @param  {function}   callback    Callback(err, response)
     * @return {void}
     */
    this.respond = function (ws, msg, callback) {

        var msgAction, target, action;

        Logger.debug && Logger.debug('WSResponder.respond', 'Received message', util.inspect(msg, false, null));

        /* Sane payload, please. */
        if (typeof msg !== 'object') {
            Logger.warn && Logger.warn('WSResponder.respond', 'Invalid payload', msg.id, msg);
            return callback(new TypeError('Payload is not an object'), {
                msg: 'response',
                status: 400
            });
        }

        /*if (!(msg.installationId && msg.hasOwnProperty('notificationId'))) {
         log.debug && log.debug('UserResponder.authenticate', 'Rejecting request with bad installation id or missing notificationId property', msg);
         return callback(null, { status: 400 });
         }*/

        /* Ensure that action exists and provides both a target and a method, separated by ':' */
        msgAction = msg.action && msg.action.split(':');
        if (!msgAction || msgAction.length !== 2) {
            Logger.warn && Logger.warn('WSResponder.respond', 'Invalid action', msg.id, msg);
            return callback(new TypeError('Action is missing or incorrectly formatted'), {
                type: 'response',
                action: msg.action,
                id: msg.id,
                status: 400
            });
        }

        target = msgAction[0];
        action = msgAction[1];

        /* Sane msg and msg.id, please. */
        if (typeof msg.id !== 'number') {
            Logger.warn && Logger.warn('WSResponder.respond', 'Message hos invalid or no id', msg.id, msg);
            return callback(new TypeError('Message hos invalid or no id'), {
                id: msg.id,
                action: msg.action,
                type: 'response',
                status: 400
            });
        }

        /* Until authenticated, the only allowed requests are those below */
        if (config.kiggit.environment === 'production' || config.kiggit.environment === 'test') {
            Logger.debug(ws.upgradeReq.headers.origin);
            /*if (!ws.upgradeReq.headers.origin || !ws.upgradeReq.headers.origin !== config.kiggit.origin) {
             log.debug && log.debug('WSResponder.' + target + '.' + action, 'Access denied for unauthenticated client', msg);

             return callback(null, {
             id: msg.id,
             action: msg.action,
             type: 'response',
             errorMsg: 'Access denied for unauthenticated client.',
             status: 401
             });
             }*/

            if (!(ws.client && ws.client.user && ws.client.user.user_id) && !(target === 'user' && (action === 'authenticate' ||
                action === 'register' || action === 'newpasswd' || action === 'pinlogin' || action === 'setcode')) && !(target === 'match' && action === 'fetchUpcoming') && !(target === 'betslip' && (action === 'fetchBetslips' || action === 'fetchBetslipDetail'))) {

                Logger.debug && Logger.debug('WSResponder.' + target + '.' + action, 'Access denied for unauthenticated client', msg);

                return callback(null, {
                    id: msg.id,
                    action: msg.action,
                    type: 'response',
                    errorMsg: 'You must be logged in.',
                    status: 401
                });
            }
        }

        /* Check that we actually have a handler for this request */
        if (!(responder[target] && responder[target][action])) {
            var errMsg = 'Message received for non-existing handler "' + target + '.' + action + '"';
            Logger.warn && Logger.warn('WSResponder.respond', errMsg, msg);
            return callback(new SyntaxError(errMsg), {
                id: msg.id,
                action: msg.action,
                type: 'response',
                status: 404,
                errMessage: errMsg
            });
        }

        // Password validation for wallet operations
        if (target === 'wallet' &&
            (action === 'addCC' || action === 'deposit' || action === 'withdraw' || action === 'disableCC') &&
            msg.data.password !== undefined) {
            userController.getByUserId(msg.data.user_id, function (err, res) {
                if (err || !res.rows) {
                    return callback(null, {
                        id: msg.id,
                        action: msg.action,
                        type: 'response',
                        errorMsg: 'System failure - please try again.',
                        status: 500
                    });
                }
                else if (res.rows.length === 0) {
                    return callback(null, {
                        id: msg.id,
                        action: msg.action,
                        type: 'response',
                        errorMsg: 'User not found',
                        status: 404
                    });
                }
                else {
                    bcrypt.compare(msg.data.password, res.rows[0].password, function (err, authAccess) {
                        if (!authAccess) {
                            return callback(null, {
                                status: 401,
                                errorMsg: 'Rejecting authentication due to mismatch between user and password',
                                id: msg.id,
                                action: msg.action,
                                type: 'response',
                            });
                        }
                        else {
                            /* Call the handler. */
                            try {
                                responder[target][action](ws, msg.data, function (err, res) {

                                    if (typeof res !== 'object')
                                        res = {};

                                    res.type = 'response';
                                    res.action = msg.action;
                                    res.id = msg.id;

                                    if (err) {
                                        res.status = 500;
                                        // TODO: Insert this when we authenticate on test again
                                        //tools.shout('SERVER ERROR', 'User '+ws.client.user.id+' got 500 server error response.', err);
                                        Logger.error && Logger.error('WSResponder.' + target + '.' + action, err, msg);
                                    }
                                    else if (log.debug) {
                                        Logger.debug('WSResponder.' + target + '.' + action, 'Sending response', res, msg);
                                    }
                                    return callback(err, res);
                                });

                            } catch (err) {
                                // TODO: Insert this when we authenticate on test again
                                //tools.shout('SERVER ERROR', 'User '+ws.client.user.id+' got 500 server error response.', err);
                                Logger.error && Logger.error('WSResponder.' + target + '.' + action, 'Internal server error', err.stack);
                                return callback(err, {status: 500, type: 'response', action: msg.action, id: msg.id});
                            }
                        }
                    });

                }
            });
        }
        else {
            /* Call the handler. */
            try {
                responder[target][action](ws, msg.data, function (err, res) {

                    /* Tag response properly (create from scratch if we get no response (error state)) */
                    if (typeof res !== 'object')
                        res = {};

                    res.type = 'response';
                    res.action = msg.action;
                    res.id = msg.id;

                    if (err) {
                        res.status = 500;
                        //tools.shout('SERVER ERROR', 'User '+ws.client.user.id+' got 500 server error response.', err);
                        Logger.error && Logger.error('WSResponder.' + target + '.' + action, err, msg);
                    }
                    else if (log.debug)
                        Logger.debug('WSResponder.' + target + '.' + action, 'Sending response', res, msg);

                    return callback(err, res);
                });
            } catch (err) {
                // TODO: Insert this when we authenticate on test again
                //tools.shout('SERVER ERROR', 'User '+ws.client.user.id+' got 500 server error response.', err);
                Logger.error && Logger.error('WSResponder.' + target + '.' + action, 'Internal server error', err.message + '\n' + err.stack);
                return callback(err, {status: 500, type: 'response', action: msg.action, id: msg.id});
            }
        }
    };
}

module.exports = new WSResponder();
