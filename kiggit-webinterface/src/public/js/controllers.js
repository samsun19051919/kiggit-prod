"use strict";

var kiggitControllers = angular.module('kiggitControllers', ['ui.bootstrap', 'ui.grid', 'ngTouch', 'ui.grid.edit', 'ui.grid.rowEdit', 'ui.grid.cellNav',]);

kiggitControllers.controller('tournamentsController', function($scope, $http, $q, $interval) {
    $scope.title = "Tournament settings";

    if (document.cookie.indexOf("jwt") !== -1) {
        $scope.Logedin = true;
    } else {
        $scope.Logedin = false;
    }
    $scope.gridOptions = {enableFiltering: true};
     
    $scope.gridOptions.columnDefs = [
      { name: 'tournament_id',  visible: false, enableCellEdit: false, cellClass: 'grey' },
      { name: 'sortorder',  width: "8%", displayName: 'Priority' },
      { name: 'country', width: "20%", displayName: 'Country', enableCellEdit: false, cellClass: 'grey'},
      { name: 'tournament_label', displayName: 'Label'},
      { name: 'tournament_name', displayName: 'Name' ,enableCellEdit: false, cellClass: 'grey'}
    ];
 
  $scope.saveRow = function( rowEntity ) {
    var promise = $q.defer();
    $scope.gridApi.rowEdit.setSavePromise( rowEntity, promise.promise );
    $http.post('./tournaments', {
         tournament: rowEntity
      })
      .success(function(data, response) {

          promise.resolve();
      })
      .error(function(data) {
             
    });
 
  }; 
 
  $scope.gridOptions.onRegisterApi = function(gridApi){
    //set gridApi on scope
    $scope.gridApi = gridApi;
    gridApi.rowEdit.on.saveRow($scope, $scope.saveRow);
  };
 
 $http.get("./tournaments/getAll")
  .success(function(data, response) {
    $scope.gridOptions.data = data;
    console.log(data);
  });

});
kiggitControllers.controller('createBetslipController', function($scope, $http) {
    $scope.title = "Create Betslips";
    $scope.selectedMatches;
    $scope.betsize = 5;
    if (document.cookie.indexOf("jwt") !== -1) {
        $scope.Logedin = true;
    } else {
        $scope.Logedin = false;
    }
    $http.get("./upcoming")
        .success(function(data, response) {
            $scope.matches = data;
        });
    $scope.setSelected = function() {
        $scope.selected = this.match;
    };
    // when submitting the add form, send the text to the node API
    $scope.create = function() {
        $http.post('./kiggitbetslip_create', {
                betsize: $scope.betsize,
                matches: $scope.selectedMatches
            })
            .success(function(data, response) {
                window.location.href = '/#/betslips';
            })
            .error(function(data) {
                
            });
    };
});
kiggitControllers.controller('betslipsController', function($scope, $http) {
    if (document.cookie.indexOf("jwt") !== -1) {
        $scope.Logedin = true;
    } else {
        $scope.Logedin = false;
    }

    $scope.sortType = 'created'; // set the default sort type
    $scope.sortReverse = false; // set the default sort order
    $scope.searchFish = ''; // set the default search/filter term
    $http.get("./betslips/getAll")
        .success(function(response) {
            $scope.betslips = response;
        });
});
kiggitControllers.controller('headerController', function($scope, $http) {
    if (document.cookie.indexOf("jwt") !== -1) {
        $scope.Logedin = true;
    } else {
        $scope.Logedin = false;
    }
});
kiggitControllers.controller('LogfileOutController', function($scope, $http) {
    $http.get("./out")
        .success(function(response) {
            $scope.content = response;
            $scope.title = "kiggit-server logfile";
            if (document.cookie.indexOf("jwt") !== -1) {

                $scope.Logedin = true;
            } else {
                $scope.Logedin = false;
            }
        });
});
kiggitControllers.controller('LogfileErrController', function($scope, $http) {
    $http.get("./err")
        .success(function(response) {
            $scope.content = response;
            $scope.title = "kiggit-server error logfile";
            //This part check if the tokken is set. This is not a security thing
            //but is used to modify layout depending on visitor is loggged in or not
            if (document.cookie.indexOf("jwt") !== -1) {
                $scope.Logedin = true;
            } else {
                $scope.Logedin = false;
            }
        });
});

kiggitControllers.controller('GetUsersController', function($scope, $http) {
    $http.get("./users/getAllUsers")
        .success(function(response) {
            $scope.Users = response;
            //This part check if the tokken is set. This is not a security thing
            //but is used to modify layout depending on visitor is loggged in or not
            if (document.cookie.indexOf("jwt") !== -1) {
                $scope.Logedin = true;
            } else {
                $scope.Logedin = false;
            }
        });
});
kiggitControllers.controller('UserController', function($scope, $http) {
    $http.get("./users/updateUser")
        .success(function(response) {
            $scope.content = response;
            $scope.title = "Add user";
            if (document.cookie.indexOf("jwt") !== -1) {
                $scope.Logedin = true;
            } else {
                $scope.Logedin = false;
            }
        });

    // when submitting the add form, send the text to the node API
    $scope.registerUser = function() {
        $http.post('./users/updateUser', $scope.formData)
            .success(function(data, response) {
                if (data.err){
                    alert(data.err);
                    return;
                }
                window.location.href = '/#/users';
                if (document.cookie.indexOf("jwt") !== -1) {
                    $scope.Logedin = true;
                } else {
                    $scope.Logedin = false;
                }
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };
    $scope.authenticateUser = function() {
        $http.post('./users/authenticate', $scope.formData)
            .success(function(data, response) {
                $scope.data = data;
                //if login was successfull add received token to all headers
                if (data.success) {
                    $http.defaults.headers.common = {
                        token: data.token
                    }
                }
                window.location.href = '/#/betslips';
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };
});