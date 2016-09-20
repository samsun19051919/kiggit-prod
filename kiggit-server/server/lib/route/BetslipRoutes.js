var RequestHandler = require('../../util/RequestHandler');

function setup(server, services) {

    var createBetslip = config.kiggit.api_prefix + '/betslips/create';
      server.post(
        {
            path: createBetslip,
            doc: 'Creates a betslip with a specific betslip_type (user or kiggit). If the \n' +
                 'betslip is a user betslip the price can only be 0 otherwise some value choosen \n' +
                 'by the creator. You can create betslips without inviting friends. \n\n' +
                 'Payload example:\n\n' +
                 '{\n' +
                 '  "data":{\n' +
                 '    "creator":"895834ba-a839-44ac-9c1c-4a435ecdca3a",\n' +
                 '    "bet_size": 100,\n' +
                 '    "price": 0,\n' +
                 '    "betslip_type": "user",\n' +
                 '    "predictions": [{\n' +
                 '      "match_id": 1,\n' +
                 '      "type": 1,\n' +
                 '      "prediction": "1-1"\n' +
                 '    }],\n' +
                 '    "invitations": [\n' +
                 '      "36fae7f6-cce2-4303-9dda-e3318f4c5af1"\n' +
                 '    ]\n' +
                 '}',
            module: 'User',
            version: '1.0.0',
            validation: {}
        }, function (req, res, next) {
            RequestHandler.handle(services.betslipService.create, req, res, function callback() {
                next();
            });
        });
};

exports.setup = setup;