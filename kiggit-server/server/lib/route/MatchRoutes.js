var RequestHandler = require('../../util/RequestHandler');

function setup(server, services) {

    var fetchUpcomingMatches = config.kiggit.api_prefix + '/matches/upcoming/:date';
    server.get(
        {
            path: fetchUpcomingMatches,
            doc: 'Gets all matches from a specific date',
            module: 'Match',
            version: '1.0.0',
            validation: {}
        }, function (req, res, next) {
            RequestHandler.handle(services.matchService.fetchUpcoming, req, res, function callback() {
                next();
            });
        });
};

exports.setup = setup;