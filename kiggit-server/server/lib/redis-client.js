'use strict';

var redis       = require('redis'),
    util        = require('util'),
    events      = require('events'),
    tools       = require('./tools'),
    konfig      = require('../konfig'),
    redisConf   = { auth_pass: konfig.redis.auth },
    log         = tools.logger
;




function RedisClient () {
    
    // this.connected = false;
    
    var self    = this,
        regInterval,
        client
    ;
    
    
    
    
    this.connect = function () {
        
        self.connected = false;
        
        if (config.redis.socket === 'unix')
            client = redis.createClient(konfig.redis.path, redisConf);
        else
            client = redis.createClient(konfig.redis.port, konfig.redis.path, redisConf);

        client.on('error', function (err) {
            var msg = 'Failed to connect to redis by {0} socket on {1} using {2} credentials.'.format(
                konfig.redis.socket,
                konfig.redis.socket === 'tcp' ? konfig.redis.path+':'+konfig.redis.port : konfig.redis.path,
                konfig.redis.auth ? konfig.redis.auth : 'no'
            );
            
            self.emit('error', err, msg);
            
            log.error && log.error(msg);
        });
        
        client.on('connect', function () {
            self.connected = true;
            
            self.emit('connect');
            
            log.info && log.info('Connected to redis by %s socket on %s using %s credentials.',
                konfig.redis.socket,
                konfig.redis.socket === 'tcp' ? konfig.redis.path+':'+konfig.redis.port : konfig.redis.path,
                konfig.redis.auth ? konfig.redis.auth : 'no'
            );
            
            /* Register this instance, and make sure we keep the registration for as long as we're up */
            client.set('client|'+konfig.localHostname, konfig.localIPv4, function (err, res) {
                if (err)
                    throw new Error('Failed to store instance in Redis');
            });
        });
    };
};

util.inherits(RedisClient, events.EventEmitter);
module.exports = new RedisClient();



















