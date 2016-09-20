'use strict';
/**
 * Very simple Facebook helpers.
 *
 * Once we get more advanced, we might wanna use something like the
 * "facebook-complete" NPM (there are a million NPMs, this one looks nice)
 *
 * TODO: Handle token expiration gracefully.
 */
var util = require('util');
var request = require('request');
var tools = require('./tools');
var log = tools.logger;

function Facebook() {

    /**
     * Fetch Facebook user data given an access token.
     *
     * Check the status code - 400 means the access token wasn't accepted.
     *
     * Only requests with status code 200 offer the callback a response object.
     *
     * Web access tokens have a shelf life of about 1-2 hours, while tokens
     * obtained through the mobile SDK live for up to 60 days. When a token has
     * expired, we should communicate this to the client so that it can obtain
     * a new token and deliver it to us.
     *
     * @param  {string}     accessToken Access token from Facebook
     * @param  {Function}   callback    Callback(err, status code, parsed response)
     * @return {void}
     */
    this.getUserData = function (accessToken, callback) {

        if (!accessToken)
            return callback(new TypeError('Need an access token'));

        request('https://graph.facebook.com/me?access_token=' + accessToken, function (err, res, body) {

            if (err)
                return callback(err);

            if (res.statusCode === 200) {
                try {
                    return callback(null, 200, JSON.parse(body));
                } catch (e) {
                    return callback(new Error('Failed to parse Facebook data'));
                }
            }

            return callback(null, res.statusCode);
        });
    };


    /**
     * Retrieve user names and ids of the Facebook friends of the user holding the access token who are also Kiggit
     * users.
     *
     * @param  {string}     accessToken Access token from Facebook
     * @param  {Function}   callback    Callback(err, status code, parsed response)
     * @return {Array}      by callback [{ {int} uid, {string} name }]
     */
    this.getKiggitFriends = function (facebook_id, fb_access_token, callback) {
        var friends = [];
        var url = util.format(config.kiggit.fb_graph_api, facebook_id, fb_access_token);
//        request('https://graph.facebook.com/v2.6/10153748765948764/friends?access_token=EAAUJxpwqSUUBACo06pvH3oZAsDTZCgDEz8qGKqr07jfWeblPZB6YcnLEzJupVkcfS2M4Xg9poycGwZAQTFx8zfNj6c8TZCqhsiMDyfeoBtZBjtL8NHwRI1cjh06h7vSCNgtgLllysWKc6f2JroYRm1oE1vDkvzjPqbdqWYakuosgZDZD', function (err, res, body) {
            request(url, function (err, res, body) {

            if (err)
                return callback(err);

            if (res.statusCode === 200) {

                var fbFriends = JSON.parse(body).data;

                if (fbFriends && fbFriends.length)
                    for (var i in fbFriends) {
                        var friend = {};
                        friend.id = fbFriends[i].id;
                        friend.name = fbFriends[i].name;
                        friends.push(friend);
                    }

                return callback(null, {statusCode: 200, friends:friends});
            }
            else {
                log.debug('Failed to get friends from Facebook');
                log.debug(res);
                return callback(null, {statusCode: res.statusCode, message: body});
            }
        });
    };
}

module.exports = new Facebook();