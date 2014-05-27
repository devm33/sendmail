(function(){

    'use strict';

    /* Profile Module */

    var services = angular.module('profile', ['messageBarApp']);

    services.factory('getProfile', function ($http, $q, $timeout, showMessageBar, logOut) {

        var profile = $q.defer(); // Note: I hope the data is happy residing solely in the deferred...

        var profileWaitCount = 0;

        var maxProfileWait = 10;

        var loadProfile = function () {
            $http.get('/profile').then(
                function (response) { // Success
                    profile.resolve(response.data);
                },
                function (response) { // Error
                    if (response.status === 409 && profile_wait_count < profile_wait_max) {
                        $timeout(loadProfile, 500);
                    } else {
                        showMessageBar('There was an error fetching your profile.' +
                            'You will be logged out in a sec. Sorry! (' +
                            response.data+')');
                        $timeout(logOut, 1000);
                    }
                }
            );
        };

        loadProfile(); // Start trying to load right away

        return function () {
            return profile.promise;
        };
    });

    services.factory('logOut', function ($http, $location, showMessageBar) {
        return function () {
            $http.get('/logout').then(
                function () { // Success
                    $location.href = '/';
                },
                function (response) { // Error
                    showMessageBar('There was an error logging you out.');
                }
            );
        };
    });

})();