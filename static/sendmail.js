/* First thing is first need to call back to the sever to get the name and 
picture url */
var loadProfile = function(){
    $.ajax({
        url: '/profile',
        dataType: 'json',
        success: function(profile) {
            $('div.lightbox').remove();
            $('#container p').html('Hi '+profile.name.givenName+', thank you for your interest in SendMail.<br>This app is still in development, but will be finished in about a month (because it\'s due for a class!). Feel free to come back then. None of your credentials have been saved in the meantime =)<br>');
            $('#container').append('<img src="'+profile.image.url.replace(/(\d)*$/,'100')+'" class="face-circle" />');
            $('#container').append('<div id="logout" class="btn right">Click here to logout</div>');
            
            //TODO update stuff according to profile
        },
        error: function(xhr, status, error) {
            if (xhr.status === 409) { //content just isnt ready
                setTimeout(function(){ loadProfile(); }, 500);
            } else {
                var err = $('<div id="error-bar">');
                err.html(xhr.status+': There was an error fetching your profile.'+
                'Please refresh to try again. Sorry!');
                $('body').prepend(err);
            }
        }
    });
};
loadProfile();

$(document).ready(function(){
    /* Bind listeners here */
    $('#container').on('click', '#logout', function(){
        $.ajax({
            url: '/logout',
            success: function(){
                window.location.href = '/';
            },
            error: function(){
                var err = $('<div id="error-bar">');
                err.html(xhr.status+': There was an error logging you out.'+
                'Please refresh to try again / see if it worked anyways. Sorry!');
                $('body').prepend(err);
            }
        });
    });
    
});

