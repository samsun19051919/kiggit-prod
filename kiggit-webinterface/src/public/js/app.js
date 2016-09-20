
var kiggitApp = angular.module('kiggitApp', [
    'ngTouch',
    'ui.grid',
    'ui.grid.rowEdit',
    'ui.grid.cellNav',
    'ngStorage',
    'ngRoute',
    'angular-loading-bar',
    'kiggitControllers'
]);
kiggitApp.config(['$routeProvider', '$httpProvider', function($routeProvider, $httpProvider) {
    $routeProvider.
        when('/', {
            controller: 'LogfileOutController'
        }).when('/logfiles', {
            templateUrl: 'partials/logfiles.html',
            controller: 'LogfileOutController'
        }).when('/out', {
            templateUrl: '/partials/log.html',
            controller: 'LogfileOutController'
        }).when('/err', {
            templateUrl: '/partials/log.html',
            controller: 'LogfileErrController'
        }).when('/users', {
            templateUrl: 'partials/users.html',
            controller: 'GetUsersController'
        }).when('/addUser', {
            templateUrl: 'partials/addUser.html',
            controller: 'UserController'
        }).when('/authenticate', {
            templateUrl: 'partials/authenticate.html',
            controller: 'UserController'
        }).when('/createbetslip', {
            templateUrl: 'partials/createbetslip.html',
            controller: 'createBetslipController'
        }).when('/betslips', {
            templateUrl: 'partials/betslips.html',
            controller: 'betslipsController'
        }).when('/tournaments', {
            templateUrl: 'partials/tournaments.html',
            controller: 'tournamentsController'
        }).
        otherwise({
            redirectTo: '/'
        });

    $httpProvider.interceptors.push(['$q', '$location', '$localStorage', function($q, $location, $localStorage) {
        return {
            'request': function (config) {
                config.headers = config.headers || {};
                if ($localStorage.token) {
                    $http.defaults.headers.common = { token : $localStorage.token }
                    //config.headers.Authorization = 'Bearer ' + $localStorage.token;
                }
                return config;
            },
            'responseError': function(response) {
                if(response.status === 401 || response.status === 403) {
                    $location.path('/authentication');
                }
                return $q.reject(response);
            }
        };
    }]);

}]);


