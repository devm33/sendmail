(function($){ /* start clean scope */

var profile_wait_max = 10; /* max number of 409's to ignore */
var profile_wait_count = 0; /* number of 409's ignored so far */

var logOut = function(){
    $.ajax({
        url: '/logout',
        success: function(){
            window.location.href = '/';
        },
        error: function(){
            showErrorBar(xhr.status+': There was an error logging you out.'+
            'Please refresh to try again / see if it worked anyways. Sorry!');
        }
    });
};

var loadProfile = function(){
    $.ajax({
        url: '/profile',
        dataType: 'json',
        success: function(profile) {
            $('div.lightbox').remove();
            var hbr = $('#header-bar .right');
            hbr.append('<img src="'+profile.imageUrl+'" class="face-circle" />');
            /* putting these here, because why not? */
            hbr.append('<div id="ExtensionInfo" style="display:none;"> <div id="ExtensionKey">' + profile.key + '</div>' +'<div id="ExtensionEmail">' + profile.email + '</div>');
            $('#from').val( profile.email).attr('readonly', true);
        },
        error: function(xhr, status, error) {
            if (xhr.status === 409 && profile_wait_count < profile_wait_max) {
                /* content just isnt ready yet, but never do anything infinitely */
                profile_wait_count += 1;
                setTimeout(loadProfile, 500);
            } else {
                $('div.lightbox').remove();
                showErrorBar(': There was an error fetching your profile.'+
                'You will be logged out in a sec. Sorry! ('+error+')');
                setTimeout(logOut, 1000);
            }
        }
    });
};

var submitEmailForm = function(event){
    /* TODO do some client-side validation */
    /* TODO ^related, maybe warn users if their time is the past
     * and it will be sent now if they proceed */

    var box = showLoadBox('Sending message...');
    $.ajax({
        url: '/schedule',
        type: 'POST',
        dataType: 'json',
        data: $('#compose').serialize(),
        success: function(data, status, xhr) {
            showSuccessBar('E-mail successfully scheduled.', 2);
            /* TODO sorry could be cleaner code */
            $('#to,#body').val('');
            $('#subject').val('New Message');
            //$('#time').val(dateLocal());
            $('#time').val((new Date()).toJSON().slice(0,-5));
        },
        error: function(xhr, status, code) {
            showErrorBar('There was an error scheduling your email: '+
                (xhr.responseText || code));
        },
        complete: function() {
            box.remove();
        }
    });
    event.preventDefault(); /*stop default form submit, should be blank,
    but good to do anyways */
};

var showErrorBar = function(msg, wait) {
    var bar = $('#error-bar');
    if(bar.length === 0) {
        bar = $('<div id="error-bar"></div>');
    }
    bar.html(msg);
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

var showLoadBox = function(msg) {
    var box = $('<div class="lightbox"><div class="content">'+
        '<img class="loading128" src="/sendmail-loading-128-opt.gif" alt="loading" />'+
        '<p>'+(msg || 'Loading...')+'</p>'+
    '</div></div>');
    box.appendTo('body');
    return box;
};

$(document).ready(function(){
    /* Bind listeners here */
    $('#container').on('click', '#logout', logOut);
    $('#container').on('submit', '#compose', submitEmailForm);

    /* Callback for profile data, will pull until it gets it */
    loadProfile();
    /* TODO load profile conditionally, get stuff passed in from node */
    
});

/* end clean scope */ })(jQuery);
