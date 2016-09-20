var Table = require('cli-table');


/**
 * Creates a list of all registered services.
 * @param routes
 * @returns {string}
 */
var api = function (routes) {
    var table = new Table({
        head: ["Method", "Module", "Path", "Versions", "Doc"]
    });

    // console.log(routes);
    // console.log('\nAPI for this service \n');
    // console.log('\n********************************************');
    // console.log('\t\tRESTIFY');
    // console.log('********************************************\n');
    for (var key in routes) {
        if (routes.hasOwnProperty(key)) {
            var val = routes[key];
            var _o = {};
//            console.log(routes);
//            console.log(val.spec.doc);
            _o[val.method] = [(val.spec.module) ? val.spec.module : '', val.spec.path, val.versions.join(','), (val.spec.doc) ? val.spec.doc : ''];
            table.push(_o);
        }
    }
    return "<pre>" +
        '<h2>' + config.kiggit.hosts + ':' + config.kiggit.port + '</h2>' +
        '<p>version:' + config.kiggit.version + '</p>' +
        '<p>nodejs version:' + process.version + '</p>' +
        '<p>dbhost:' + config.kiggit.hosts + '</p>' +
        '<p>keyspace:' + config.kiggit.keyspace + '</p>' +
        table.toString() +
        "</pre>";
};

module.exports.api = api;
