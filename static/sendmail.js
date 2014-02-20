$('#signinButton').click(function(){
    var config = {
        'client_id': '864350449269-19ud33g4q9e5u4issbftjltothgq01ph.apps.googleusercontent.com',
        'scope': 'profile email'
    };
    gapi.auth.authorize(config, function() {
        console.log('login complete');
        console.log(gapi.auth.getToken());
        
        gapi.client.load('plus', 'v1', function() {
          var request = gapi.client.plus.people.get({
            'userId': 'me'
          });
          request.execute(function(resp){
            console.log(resp);
            $('#container p').html('<img src="'+resp.image.url+'" class="face-circle" />'+'Hi '+resp['name']['givenName']+' thank you for your interest in sendmail.<br>This app is still in development, but will be done in about a month (because it\'s due for a class!). Feel free to come back then. None of your credentials have been saved in the meantime =)');
          });
        });
    });
});
