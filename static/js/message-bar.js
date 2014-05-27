(function(){

    'use strict';

    /* Message Module
     * as in the messages display at the top of the window to the user
     */

    var msgBar = angular.module('messageBarApp', []);

    msgBar.factory('showMessageBar', function ($rootScope) {
        return function (msg, options) {
            $rootScope.$broadcast('showMessageBar', msg, options);
        };
    });

    msgBar.directive('messageBar', function ($timeout) {
        return {
            restrict: 'A',
            templateUrl: '/partials/message-bar.html',
            scope: {},
            link: function (scope) {
                scope.$on('showMessageBar', function (event, msg, options) {
                    if (!msg) {
                        return;
                    }
                    options = options || {};
                    scope.message = msg;
                    scope.show = true;
                    scope.success = options.succcess;
                    if (typeof options.wait === 'number') {
                        $timeout(function () {
                            scope.show = false;
                        }, options.wait * 1000);
                    }
                });
            }
        };
    });

})();