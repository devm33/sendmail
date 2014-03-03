/* First thing is first need to call back to the sever to get the name and 
picture url */
var loadProfile = function(){
    $.ajax({
        url: '/profile',
        dataType: 'json',
        success: function(profile) {
            $('div.lightbox').remove();
            var hbr = $('#header-bar .right');
            hbr.append('<img src="'+profile.image.url+'" class="face-circle" />');
            /* hbr.append(profile.emails[0].value); looks ugly? */
            hbr.append('<div id="logout" class="btn">Sign Out</div>');
            $('#from').val(profile.emails[0].value).attr('readonly', true);
        },
        error: function(xhr, status, error) {
            if (xhr.status === 409) { /* content just isnt ready yet */
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
var showErrorBar = function(msg, wait) {
    var bar = $('#error-bar');
    if(bar.length == 0) {
        bar = $('<div id="error-bar"></div>');
    }
    bar.text(msg);
    if(wait && typeof wait === 'number' && wait > 0) {
        /* default is to not hide msg bar */
        setTimeout(function(){bar.remove();}, wait * 1000);
    }
    bar.prependTo('body');
    return bar;
};
var showSuccessBar = function(msg, wait) {
    showErrorBar(msg, wait).addClass('success');
};

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
    $('#container').on('submit', '#compose', function(event){
        $.ajax({
            url: '/schedule',
            type: 'POST',
            dataType: 'json',
            data: $('#schedule').serialize(),
            success: function(data) {
                showSuccessBar('E-mail successfully scheduled.', 5);
                /* TODO clear out form values */
            },
            error: function(xhr, status, code) {
                showErrorBar('There was an error scheduling your email: '+code);
            }
        });
        event.preventDefault(); //stop default form submit
    });


    /* Callback for profile data, will pull until it gets it */
    loadProfile();
});

