(function(){

    'use strict';

    /* Mail Module */

    var mail = angular.module('mailApp', []);

    mail.factory('mailService', function ($http) {
        var self;

        self.getList = function () {
            // TODO
        };

        return self;
    });

})();