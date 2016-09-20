var RequestHandler = require('../../util/RequestHandler');

function setup(server, services) {

    var updatePassword = config.kiggit.api_prefix + '/users/password/forgot';
    server.put(
        {
            path: updatePassword,
            doc: 'Updates the users password if requested by\n\n ' +
                 'Payload example: \n\n' +
                 '{\n' +
                 '  "data":{\n' +
                 '    "email":"jnn@friaminds.dk"\n' +
                 '  }\n' +
                 '}',
            module: 'User',
            version: '1.0.0',
            validation: {}
        }, function (req, res, next) {
            console.log(req);
            RequestHandler.handle(services.userService.uppasswd, req, res, function callback() {
                next();
            });
        });
};

exports.setup = setup;