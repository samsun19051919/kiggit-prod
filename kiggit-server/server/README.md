Environment variables
=====================

npm install
NODE_ENV={PROFILENAME} node websocket-worker.js to start server.

General
-------
    NODE_ENV            The current runtime environment.
                        Defaults to development.
                        Possible values: development, test, production.
                        
    PORT                Port to listen on.
                        Defaults to 8080.
                        
    EMAIL_RECIPIENT     Who should receive shouts when something goes very wrong.
                        Defaults to danielbuus@gmail.com. TODO: Pick this up from env.
                        
    LOG_LEVEL           Verbosity of logging.
                        Defaults to debug.
                        Verbosity (most to least): debug, info, warn, error, none.
                        
    MIN_IOS_APP_BUILD   The minimum iOS app build supported by the server.
                        Defaults to 0.
                        If a client attempts to connect with an unsupported app
                        build, he or she will be rejected and asked to update.
                        
    STATIC_HOST         Hostname for serving out static files.
                        Defaults to http://static.kiggit.com.



Web sockets
-----------
    WS_IOS_CLIENT_PING_INTERVAL
                        How often, in seconds, the client should ping the server
                        on its web socket connection in order to keep it alive.
                        Defaults to 10.
                        
    WS_IOS_CLIENT_PONG_TIMEOUT
                        How long to wait for a pong after a ping before a retry.
                        Defaults to 5.
                        
    WS_IOS_CLIENT_MSG_TIMEOUT
                        How long to wait for a response on a message before a
                        retry.
                        Defaults to 5.
                        
    WS_IOS_CLIENT_CONNECTION_TIMEOUT
                        How many seconds to wait for a connection request to
                        succeed before assuming failure.
                        Defaults to 3.
                        
    WS_IOS_CLIENT_FACEBOOK_TIMEOUT
                        How many seconds to wait for a connection request to
                        Facebook to succeed before assuming failure.
                        Defaults to 6.
                        
    WS_IOS_CLIENT_RECONNECT_MIN_INTERVAL
                        When reconnecting, the minimum number of seconds between
                        attempts.
                        Defaults to 2.
                        
    WS_IOS_CLIENT_RECONNECT_MAX_INTERVAL
                        When reconnecting, the maximum number of seconds between
                        attempts.
                        Defaults to 30.
                        
    WS_IOS_CLIENT_BACKOFF_FACTOR
                        The factor to use in the back-off algorithm on the
                        client to determine how quickly to step down on the
                        reconnect attempt frequency. The higher the number, the
                        quicker we begin to back off.
                        Defaults to 2.
                        
    WS_IOS_CLIENT_RECONNECT_MAX_TRIES
                        The maximum number of times a client should attempt to
                        reconnect before giving up.
                        Defaults to 2.
                        
    WS_IOS_CLIENT_DATA_REFRESH_INTERVAL
                        How often, in seconds, the client should poll for new
                        data (only valid until we have proper web socket push).
                        Defaults to 60
                        
    WS_IOS_CLIENT_RATING_REQUEST_TRIGGER
                        The number of events (currently completed games) after
                        which to request the user to rate the app.
                        Defaults to 5
                        
    WS_IOS_CLIENT_RATING_REQUEST_REMIND_PERIOD
                        Number of days to wait before requesting again after a
                        user has asked to be reminded later about rating.
                        Defaults to 7 (floats allowed)
                        
    WS_IOS_CLIENT_RATING_REQUEST_HEADER
                        The header text for the rating request dialog.
                        Defaults to "HIGH FIVE!"
                        
    WS_IOS_CLIENT_RATING_REQUEST_BODY
                        The body text for the rating request dialog.
                        Defaults to "You just completed 5 challenges!\nIf you
                            would like to rate Kiggit with 5 stars then please
                            take a moment to do so. It won't take more than a
                            minute. Thanks for your support!"



Throttles
---------
    GAMES_STARTED_MAX_RETURN_COUNT
                        The maximum number of started (or higher, i.e. closed)
                        games to return to clients.
                        Defaults to 25.



Cassandra
---------
    CASSANDRA_LAN_NODES
                        Comma-separated list of (LAN) addresses for the Cassandra
                        driver to connect to. These are automatically detected and
                        registered on EC2 instances.
                        Defaults to 'localhost'.



Redis
-----
    REDIS_HOST          Hostname/IP of the Redis server.
                        If not provided, the app will attempt to connect via a UNIX
                        socket in /var/run/redis/redis.sock or /tmp/redis.sock if
                        either exists, otherwise it'll attempt to connect to
                        127.0.0.1 via TCP.

    REDIS_PORT          Port number.
                        Defaults to 6379 if not provided.

    REDIS_PASS          Auth credentials, if required.



Caching
-------
    CACHE_DURATION_UPCOMING_MATCHES
                        Number of seconds to memcache the list of upcoming matches.
                        Defaults to 60.
    
    CACHE_DURATION_UPCOMING_FEATURED_GAMES
                        Number of seconds to keep upcoming featured games cached in
                        memory (e.g. Kiggit challenges and welcoming games).
                        Defaults to 1800.
    
    GAMES_FEATURED_MIN_START_DELTA
                        The number of seconds into the future an upcoming featured
                        game must be scheduled to start to be offered to new sign-
                        ups.
                        Defaults to 600.
    
    APNS_CACHE_SIZE
                        Number of iOS/APNS push notifications to keep in memory
                        for recovery purposes in the event of communication errors.
                        Node-apn docs state that, "Testing has shown that an error
                        response can take as long as 200ms, while the module has
                        proven the ability to send over 5000 notifications/sec."
                        
                        Cache length is automatically increased if insufficent.
                        
                        Defaults to 500.



General Notes
=============






