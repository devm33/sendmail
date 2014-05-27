(function(){

    'use strict';

    /* Controllers Module */

    var ctrls = angular.module('controllersApp', ['mailApp']);

    ctrls.controller('ComposeCtrl', function ($scope) {

        var defaults = {
            'to': '',
            'id': '',
            'body': '',
            'time': '',
            'subject': ''
        };

        $scope.mail = {};

        $scope.reset = function() {
            $scope.mail = angular.copy(defaults);
        };

        $scope.$on('loadMail', function (event, mail) {
            $scope.mail = angular.copy(mail);
        });

    });

    ctrl.controller('ListCtrl', function ($scope, interCtrl, mailService) {

    });

    ctrl.factory('interCtrl', function ($rootScope) {
        return {
            loadMail: function (mail) {
                $rootScope.$broadcast('loadMail', mail);
            }
        };
    });

})();