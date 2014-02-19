

function signinCallback(authResult) {
    if (authResult['status']['signed_in']) { // user signed in
        $('#signinButton').hide();//hide the sign-in button
        
        //TODO
        console.log("authcode: "+authResult['code']);
        console.log("access_token: "+authResult['access_token']);
        
    } else {
        // Update the app to reflect a signed out user
        // Possible error values:
        //   "user_signed_out" - User is signed-out
        //   "access_denied" - User denied access to your app
        //   "immediate_failed" - Could not automatically log in the user
        console.log('Sign-in state: ' + authResult['error']);
    }
    
    console.log(authResult);
}

  /* Executed when the APIs finish loading */
function render() {
    var additionalParams = {
        'callback': signinCallback
    };

    $('#signinButton').click(function() {
        gapi.auth.signIn(additionalParams); // Will use page level configuration
    });
}

(function() {
var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true;
po.src = 'https://apis.google.com/js/client:plusone.js?onload=render';
var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s);
})();
