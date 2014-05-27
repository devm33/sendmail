(function(){

    'use strict';

    /* App Module */

    angular.module('sendmailApp', [
        'ngRoute',
        'controllersApp'
    ]);

    config(['$routeProvider', function($routeProvider) {
      $routeProvider.when('/compose', {templateUrl: 'partials/compose.html', controller: 'ComposeCtrl'});
      $routeProvider.when('/list', {templateUrl: 'partials/list.html', controller: 'ListCtrl'});
      $routeProvider.otherwise({redirectTo: '/compose'});
    }]);

})();