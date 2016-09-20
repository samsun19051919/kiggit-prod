'use strict';

var fs   = require('fs');
var conf = module.exports;
global.config = require('konfig')({
    path: './config'
});

function numOr (possibleNumber, or) {
    //return isNaN(poss.bleNumber) ? or : +possibleNumber;
}

conf.cacheDuration = {
    upcomingMatches       : numOr(process.env.CACHE_DURATION_UPCOMING_MATCHES, 60) * 1000,
    upcomingFeaturedGames : numOr(process.env.CACHE_DURATION_UPCOMING_FEATURED_GAMES, 30 * 60) * 1000
}

conf.supportedInstallationTypes = {
    iOS: true
}

conf.supportedBuilds = {
    iOS: numOr(process.env.MIN_IOS_APP_BUILD, 0)
};

conf.pwdSaltIterations = 10;

conf.apns = {
    cacheLength: numOr(process.env.APNS_CACHE_SIZE, 500)
};

conf.kiggitUserId          = '100006092506035';
conf.kiggitWelcomingUserId = '100008389454380';

conf.games = {
    /* How many msecs before scheduledStart we must be on a match before acting on a status change event into 'inprogress' and start games based on it. This must be sensible — you should consider how often the cron-like worker looks for entries in gameToStartByTime versus how long it will take for us to finish starting games on a match before we'll be clearing those same entries. */
    earlyMatchStartMinTimeDelta : 2*60*1000,
    /* The maximum number of started (or higher, i.e. closed) games to return to clients. */
    startedMaxReturnCount       : numOr(process.env.GAMES_STARTED_MAX_RETURN_COUNT, 25),
    featuredGameMinStartDelta   : numOr(process.env.GAMES_FEATURED_MIN_START_DELTA, 10*60) * 1000
};

conf.matches = {
    fetchDefaultTimespan : numOr(process.env.MATCH_FETCH_DEFAULT_DAYS_COUNT, 23) * 24 * 60 * 60 * 1000
};

/* If no other valid environment is specified, we run in development mode */
conf.env = ['development', 'production', 'test'].indexOf(process.env.NODE_ENV) === -1 ? 'development' : process.env.NODE_ENV;

/* Reconstruct the command line used to launch this instance */
conf.commandLine = process.execPath + process.argv.join(' ') + ' ' + process.execArgv.join(' ');

/* When clustering websocket workers, we specify the listening port for each individual worker by an environment variable. If nothing else is specified, we default to port 4000 */
conf.port = process.env.PORT || 4000;

/* Email recipient for server shouts */
conf.emailRecipient = process.env.EMAIL_RECIPIENT || 'jn@friaminds.dk';

/* Web socket connection settings for clients. These are sent out to clients when authorized.*/
conf.clientConnectionSettings = {
    iOS : {
        pingInterval              : numOr(process.env.WS_IOS_CLIENT_PING_INTERVAL                , 10),
        pongTimeout               : numOr(process.env.WS_IOS_CLIENT_PONG_TIMEOUT                 , 5),
        msgTimeout                : numOr(process.env.WS_IOS_CLIENT_MSG_TIMEOUT                  , 5),
        facebookTimeout           : numOr(process.env.WS_IOS_CLIENT_FACEBOOK_TIMEOUT             , 6),
        connectionTimeout         : numOr(process.env.WS_IOS_CLIENT_CONNECTION_TIMEOUT           , 3),
        reconnectMinInterval      : numOr(process.env.WS_IOS_CLIENT_RECONNECT_MIN_INTERVAL       , 2),
        reconnectMaxInterval      : numOr(process.env.WS_IOS_CLIENT_RECONNECT_MAX_INTERVAL       , 30),
        backoffFactor             : numOr(process.env.WS_IOS_CLIENT_BACKOFF_FACTOR               , 2),
        reconnectMaxTries         : numOr(process.env.WS_IOS_CLIENT_RECONNECT_MAX_TRIES          , 2),
        dataRefreshInterval       : numOr(process.env.WS_IOS_CLIENT_DATA_REFRESH_INTERVAL        , 60),
        ratingRequestTrigger      : numOr(process.env.WS_IOS_CLIENT_RATING_REQUEST_TRIGGER       , 5),
        ratingRequestRemindPeriod : numOr(process.env.WS_IOS_CLIENT_RATING_REQUEST_REMIND_PERIOD , 7),
        ratingRequestHeader       : process.env.WS_IOS_CLIENT_RATING_REQUEST_HEADER || "HIGH FIVE!",
        ratingRequestBody         : process.env.WS_IOS_CLIENT_RATING_REQUEST_BODY   || "You just completed 5 challenges!\nIf you would like to rate Kiggit with 5 stars then please take a moment to do so. It won't take more than a minute. Thanks for your support!",
        /* Flip switch to satisfy the KGB */
        babyKillingFacebookNazisNeedGayStroking : false
    }
}

conf.staticHost = process.env.STATIC_HOST || 'http://static.kiggit.com';

if (conf.env === 'production') {
    
    conf.emailAuthor = process.env.INSTANCE_NAME+' worker on port '+conf.port+'<'+process.env.EMAIL_SENDER+'>';
    
    conf.cluster = {
        cassandraLanNodes : process.env.CASSANDRA_LAN_NODES,
        cassandraWanNodes : process.env.CASSANDRA_WAN_NODES,
        clusterWanNodes   : process.env.CLUSTER_WAN_NODES,
        regionsAvailable  : process.env.EC2_REGIONS,
        regionsOccupied   : process.env.EC2_REGIONS_WITH_INSTANCES
    };
    
    /* Grab EC2 instance information for production servers from the environment. */
    conf.instance = {
        name               : process.env.INSTANCE_NAME,
        hostname           : process.env.EC2_LOCAL_HOSTNAME,
        localHostname      : process.env.EC2_LOCAL_HOSTNAME,
        publicHostname     : process.env.EC2_PUBLIC_HOSTNAME,
        region             : process.env.AWS_DEFAULT_REGION,
        availabilityZone   : process.env.EC2_AVAILABILITY_ZONE,
        userData           : process.env.EC2_USER_DATA,
        kernelId           : process.env.EC2_KERNEL_ID,
        amiId              : process.env.EC2_AMI_ID,
        ancestorAmiIds     : process.env.EC2_ANCESTOR_AMI_IDS,
        amiLaunchIndex     : process.env.EC2_AMI_LAUNCH_INDEX,
        amiManifestPath    : process.env.EC2_AMI_MANIFEST_PATH,
        instanceAction     : process.env.EC2_INSTANCE_ACTION,
        instanceId         : process.env.EC2_INSTANCE_ID,
        instanceType       : process.env.EC2_INSTANCE_TYPE,
        mac                : process.env.EC2_MAC,
        localIPv4          : process.env.EC2_LOCAL_IPV4,
        publicIPv4         : process.env.EC2_PUBLIC_IPV4,
        profile            : process.env.EC2_PROFILE,
        ramDiskId          : process.env.EC2_RAMDISK_ID,
        publicKeys         : process.env.EC2_PUBLIC_KEYS,
        reservationId      : process.env.EC2_RESERVERATION_ID,
        securityGroups     : process.env.EC2_SECURITY_GROUPS,
        productCodes       : process.env.EC2_PRODUCT_CODES,
        blockDeviceMapping : process.env.EC2_BLOCK_DEVICE_MAPPING,
        ebsDevsCount       : process.env.EBS_DEVS_COUNT,
        ebsDevs            : process.env.EBS_DEVS,
        ephemeralDevsCount : process.env.EPHEMERAL_DEVS_COUNT,
        ephemeralDevs      : process.env.EPHEMERAL_DEVS
    };
        
} else {

    conf.emailAuthor    = 'Kiggit <no-reply@kiggit.com>';
    
    conf.cluster = {
        cassandraLanNodes : config.kiggit.hosts,
        cassandraWanNodes : config.kiggit.hosts,
        clusterWanNodes   : config.kiggit.hosts,
        regionsAvailable  : 'dev-region',
        regionsOccupied   : 'dev-region'
    };
    
    conf.instance       = {
        name               : 'dev-instance',
        hostname           : 'localhost',
        localHostname      : 'localhost',
        publicHostname     : 'public.localhost',
        region             : 'dev-region',
        availabilityZone   : 'dev-az',
        userData           : 'dev-user-data',
        kernelId           : 'dev-kernel-id',
        amiId              : 'dev-ami',
        ancestorAmiIds     : 'dev-ancestor-ami',
        amiLaunchIndex     : 0,
        amiManifestPath    : 'none',
        instanceAction     : 'none',
        instanceId         : 'i-dev',
        instanceType       : 'dev-instance',
        mac                : '00:00:00:00:00:00',
        localIPv4          : '127.0.0.1',
        publicIPv4         : '127.0.0.1',
        profile            : 'dev-profile',
        ramDiskId          : 'dev-ramdisk',
        publicKeys         : '0=dev-public-keys',
        reservationId      : 'dev-reservation-id',
        securityGroups     : 'dev-security-group',
        productCodes       : 'dev-product-codes',
        blockDeviceMapping : { dev: '/dev' },
        ebsDevsCount       : 0,
        ebsDevs            : '',
        ephemeralDevsCount : 0,
        ephemeralDevs      : ''
    };
    
}

/* Redis connection — TCP or UNIX socket? */
if (process.env.REDIS_HOST) {
    conf.redis = {
        socket  : 'tcp',
        path    : process.env.REDIS_HOST,
        port    : numOr(process.env.REDIS_PORT, 6379),
        auth    : process.env.REDIS_AUTH
    }
} else {
    var unixSocket = fs.existsSync('/var/run/redis/redis.sock') ? '/var/run/redis/redis.sock' : fs.existsSync('/tmp/redis.sock') ? '/tmp/redis.sock' : false;
    conf.redis = {
        socket  : unixSocket ? 'unix' : 'tcp',
        path    : unixSocket ? unixSocket : '127.0.0.1',
        port    : unixSocket ? null : 6379,
        auth    : process.env.REDIS_AUTH
    }
}

/* Logging level */
conf.logLevel = ['debug','info','warn','error','none'].indexOf(process.env.LOG_LEVEL) > -1 ? process.env.LOG_LEVEL : 'debug';
