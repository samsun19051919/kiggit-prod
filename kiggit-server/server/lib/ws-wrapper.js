/**
 * Wraps web socket communication and implements callbacks for outgoing requests.
 *
 * Keeps track of connected clients.
 *
 * Incoming requests are handled by WSResponder.
 *
 * Status codes à la HTTP are returned with each response. Possible codes are: (TODO, there are now more)
 *
 * 200 OK
 *     Request was accepted, all is well.
 * 400 Bad Request
 *     Syntax error. The message failed parsing.
 * 401 Unathorized
 *     Any unauthenticed attempt to access methods besides user.authorize, or when providing unknown
 *     or invalid credentials (such as bad password or expired Facebook access token) on user.authorize.
 * 406 Not Acceptable
 *     Unsupported client platform (possibly connecting from a parallel universe).
 * 426 Upgrade Required
 *     In case the client is running an app version too old for the server to support it.
 */

'use strict';

var konfig = require('../konfig');
var tools = require('./tools');
var responder = require('./ws-responder');
var WSS = require('ws').Server;
var clients = {};
var clientsCount = 0;
var nextMsgId = 0; // Incrementing ids are good up to 9,007,199,254,740,992.
var defaultRetriesCount = 3;
var requestCallbacks = {};
var Logger = require('../util/Logger');
var https = require('https');
var fs = require('fs');
var path = require('path');
var restify = require('restify');
var UserService = require('./service/user');
var userRoute = require('./route/UserRoutes');
var MatchService = require('./service/match');
var matchRoute = require('./route/MatchRoutes');
var BetslipService = require('./service/betslip');
var betslipRoute = require('./route/BetslipRoutes');
var apiService = require('./service/APIService');

function onMessage(ws, msg) {
    /* First of all, we need to parse the message */
    try {
        msg = JSON.parse(msg);
    } catch (err) {
        Logger.warn && Logger.warn('WSS.on:message', 'Failed to parse message', msg, err);
        return ws.send(JSON.stringify({status: 400}));
    }

    /* If this is a response to a previous message, find the callback and fire it */
    if (msg.type === 'response') {

        Logger.debug && Logger.debug('WSS.on:message', 'Received response', msg);

        var callback = requestCallbacks[msg.id];

        if (callback) {
            Logger.debug && Logger.debug('WSS.on:message', 'Executing callback for response', msg);

            callback(msg);
            delete requestCallbacks[msg.id];
        }

        return;
    }

    /* Otherwise, forward the request to the responder and let it handle it */
    responder.respond(ws, msg, function (err, res) {
        ws.send(JSON.stringify(res), function (err /* , ?, ?, ? */) {
            if (err)
                Logger.warn && Logger.warn('TODO: HANDLE ERRORS, E.G. WE GET THIS WITH A "NOT OPENED" ERROR IF THE CLIENT CLOSES', err);
            /* TODO */
        });
    });
};


function onAuthenticated(ws) {
    Logger.debug && Logger.debug('Web socket server on port ' + config.kiggit.port, 'User authenticated', ws.client);

    ++clientsCount;

    clients[ws.client.user.id] = ws;

    Logger.debug && Logger.debug('Web socket server on port ' + config.kiggit.port, 'Clients', clients);
};


function onClose(ws) {
    Logger.debug && Logger.debug('Web socket server on port ' + config.kiggit.port, 'Web socket closed', ws.client, ws.client ? clients[ws.client.user.id] : null);

    if (ws.client && ws.client.user.id) {
        --clientsCount;
        delete clients[ws.client.user.id];
    }
};


function WSWrapper() {
    var cfg = {
        ssl: config.kiggit.https,
        ssl_key: path.join(config.kiggit.ssl_path, 'key.pem'),
        ssl_cert: path.join(config.kiggit.ssl_path, 'cert.pem')
    };

    var wss, opts;

    if (cfg.ssl) {
        opts = {
            name: 'Kiggit backend',
            // providing server with  SSL key/cert
            key: fs.readFileSync(cfg.ssl_key),
            cert: fs.readFileSync(cfg.ssl_cert)
        }
    } else {
        opts = {name: 'Kiggit backend'};
    }
    var server = restify.createServer(opts);

    server.use(restify.bodyParser({maxBodySize: 10485760}))
    server.pre(restify.pre.sanitizePath());
    restify.CORS.ALLOW_HEADERS.push('Access-Control-Allow-Credentials');
    restify.CORS.ALLOW_HEADERS.push('access-token');
    server.use(restify.gzipResponse());

    var services = {
        userService: new UserService(),
        matchService: new MatchService(),
        betslipService: new BetslipService()
    }
    userRoute.setup(server, services);
    matchRoute.setup(server, services);
    betslipRoute.setup(server, services);

    var getAPI = '/doc';
    var doc = 'This service shows this page - which is a list of all running services on this server.';
    server.get({path: getAPI, name: 'show api', versions: '1.0.0', doc: doc}, function (req, res, callback) {
        var table = apiService.api(server.router.mounts);

        res.writeHead(200, {
            'Content-Length': Buffer.byteLength(table),
            'Content-Type': 'text/html; charset=utf-8'
        });
        res.write(table);
        res.end();

        callback();
    });


    wss = new WSS({lientTracking: false, server: server});
    wss.on('connection', function (ws) {
        Logger.debug && Logger.debug('Web socket opened on server on port %d', config.kiggit.port, ws._socket._handle.fd);

        ws.on('message', function (msg) {
            onMessage(ws, msg);
        });
        ws.on('authenticated', function () {
            onAuthenticated(ws);
        });
        ws.on('close', function () {
            onClose(ws);
        });
    });


    this.listen = function () {
        server.listen(config.kiggit.port, function () {
            var protocol = (config.kiggit.https) ? 'https' : 'http';
            Logger.info('Server listening on port ' + config.kiggit.port + ' ' + protocol);
        });
    };


    /**
     * Sends a message to a connected client by user id.
     *
     * Callback receives ReferenceError if there's no user by said id connected.
     *
     * @param  {int}      userId   The user's id
     * @param  {object}   msg      Payload to send
     * @param  {int}      retries  Number of retries on bad connections. Defaults to 3.
     * @param  {int}      delay    Retry delay, in msecs. Defaults to 5000.
     * @param  {function} callback Callback to fire when the client responds or the request fails.
     *
     * @return {void}
     */
    this.send = function (userId, msg, retries, delay, callback) {

        var retries = typeof retries === number ? retries : defaultRetriesCount,
            delay = typeof delay === number ? delay : defaultRetriesCount,
            ws = clients[userId];

        if (!ws) {
            Logger.warn && Logger.warn('WSWrapper.send', 'User is not connected', userId, msg, retries, delay);
            return callback(new ReferenceError('User is not connected'));
        }

        msg.id = nextMsgId++;

        requestCallbacks[msg.id] = callback;

        var query = function () {
            Logger.debug && Logger.debug('WSWrapper.send', 'Sending message', msg, retries, delay);

            ws.send(msg, function (err) {
                if (err) {
                    Logger.debug && Logger.debug('WSWrapper.send', 'Failed to send message', msg, retries, delay);

                    if (--retries > -1) {
                        Logger.debug && Logger.debug('WSWrapper.send', 'Requeueing message', msg, retries, delay);
                        setTimeout(query, delay);
                    }
                }
            });
        };

        query();
    };
}

module.exports = new WSWrapper();












