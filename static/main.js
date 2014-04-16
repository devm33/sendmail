(function($){ /* start clean scope */

var profile_wait_max = 10; /* max number of 409's to ignore */
var profile_wait_count = 0; /* number of 409's ignored so far */

var logOut = function(){
    $.ajax({
        url: '/logout',
        success: function(){
            window.location.href = '/';
        },
        error: standardErrorFn('logging you out')
    });
};

var loadProfile = function(){
    $.ajax({
        url: '/profile',
        dataType: 'json',
        success: function(profile) {
            $('div.lightbox').remove();
            var hbr = $('#header-bar .right'); /* TODO using templates could make this better */
            hbr.append('<img src="'+profile.imageUrl+'" class="face-circle" />');
            hbr.append('<div id="logout" class="btn">Sign Out</div>');
            /* putting these here, because why not? */
            hbr.append('<div id="ExtensionInfo" style="display:none;" data-key="' + profile.key + '" data-email="' + profile.email + '"></div>');
            $('#from').val( profile.email).attr('readonly', true);
        },
        error: function(xhr, status, error) {
            if (xhr.status === 409 && profile_wait_count < profile_wait_max) {
                /* content just isnt ready yet, but never do anything infinitely */
                profile_wait_count += 1;
                setTimeout(loadProfile, 500);
            } else {
                $('div.lightbox').remove();
                showErrorBar('There was an error fetching your profile.'+
                'You will be logged out in a sec. Sorry! ('+error+')');
                setTimeout(logOut, 1000);
            }
        }
    });
};

var populateEmailForm = function(obj) {
    $.each(obj, function(key, val) {
        if(compose_els[key]) {
            compose_els[key].val(val);
        }
    });
    //sets the value of the datetimepicker based on the UTC value of hidden field
    //get value form element
    var dateString;
    var dateValue = compose_els['time'].val();
    if(dateValue == ""){
        dateString = "    /  /     :  ";
    }
    else{
        //create date object from UTC - ISO string format ensures parsed as UTC
        var date = new Date(dateValue);
        //make some changes, since we need leading zeros
        var month = date.getMonth();
        month = (month<10)?("0"+(month+1)):(month+1);
        var day = date.getDate();
        day = (day<10)?("0"+day):day;
        var hours = date.getHours();
        hours = (hours<10)?("0"+hours):hours;
        var minutes = date.getMinutes();
        minutes = (minutes<10)?("0"+minutes):minutes;
        //then contruct string from value - the conversion happens here since functions used return local time
        dateString = date.getFullYear() + "/" + month + "/" + day + " " + hours + ":" + minutes;
    }
    $('#datetimepick').datetimepicker({
        value: dateString
    });

};

var clearEmailForm = function() {
    populateEmailForm({
        'to': '',
        'id': '',
        'body': '',
        'time': '',
        'subject': ''
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
            clearEmailForm();
        },
        error: standardErrorFn('scheduling your email'),
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

var standardErrorFn = function(msg, time) {
    return function(xhr, status, code) {
        console.log(xhr);
        console.log(status);
        console.log(code);
        console.log(arguments);
        showErrorBar('There was an error ' + msg + ': ' +
            (xhr.responseJSON.message || xhr.responseText || status) +
            '. Try again?', time);
    };
};

var switchView = function() {
    if($(this).hasClass('selected')) {
        return;
    }
    view_compose.toggleClass('selected');
    view_list.toggleClass('selected');
    compose.toggle();
    list.toggle();
    if(view_list.hasClass('selected')) {
        /* Re-add loading element if not there */
        if(!list_loading_text.parent()) {
            list.append(list_loading_text);
        }
        var mail_req = {
            url: '/mailforuser',
            type: 'GET',
            dataType: 'json',
            success: function(data, status, xhr) {
                mail_list_updated = data;
            },
            error: standardErrorFn('fetching your scheduled mail', 3)
        };
        var done_func = function() {
            if(!_.isEqual(mail_list, mail_list_updated)) {
                mail_list = mail_list_updated;
                list.html(ejs.render(mail_list_template, {'mail':mail_list}));
            }
            list_loading_text.remove();
        };
        if(!mail_list_template) {
            var template_req = {
                url: '/views/maillist.ejs',
                type: 'GET',
                success: function(data, status, xhr) {
                    mail_list_template = data;
                },
                error: standardErrorFn('loading content', 3)
            };
            $.when($.ajax(mail_req), $.ajax(template_req)).done(done_func);
        }
        else {
            $.ajax(mail_req).done(done_func);
        }
        /* TODO it'd be a decent win to have this check a last mod on
         * the mail items from redis or something -- rather than using
         * lodash to do some heavy, albeit nicely optimized, lifting */
    }
};

var findMail = function(id, return_index) {
    if(mail_list) {
        for(i = 0; i < mail_list.length;  i++) {
            if(mail_list[i].id == id) {
                if(return_index) {
                    return i;
                }
                else {
                    return mail_list[i];
                }
            }
        }
    }
    return;
};

var editMail = function(){
    /* Find mail in mail list by id */
    var mail = findMail($(this).data('id'));

    /* Load mail into form */
    populateEmailForm(mail);

    /* Switch view to form */
    view_compose.click();
};

var deleteMail = function(){
    var $this = $(this);
    var id = $this.data('id');
    var parent = $this.parent();
    var mail_i = findMail(id, true);
    $.ajax({
        url: '/deletemail/'+id,
        success: function(data, status, xhr) {
            parent.remove();
            mail_list.splice(mail_i, 1);
            showSuccessBar('E-mail successfully deleted.', 2);
            if(mail_list.length === 0) {
                /* edge case, rely on template */
                list.html(ejs.render(mail_list_template));
            }
        },
        error: standardErrorFn('deleting that message')
    });
};

$(document).ready(function(){
    /* Reused elements (minimize dom queries)
     * note: declared in scope global to this module */
    view_compose = $('#view-compose');
    view_list = $('#view-list');
    compose = $('#compose');
    list = $('#list');
    list_loading_text = $('#list-loading-text'); /* TODO maybe use a template and/or make prettier? */
    compose_els = {
        'to': $('#to'),
        'id': $('#id'),
        'from': $('#from'),
        'body': $('#body'),
        'time': $('#time'),
        'subject': $('#subject'),
        'compose': $('#compose')
    };
    $('#datetimepick').datetimepicker({
        lang: 'en',
        step: 30,
        mask: true,
        format: "Y/m/d H:i",
        minDate:0,
        minTime:0,
        onChangeDateTime:function(dp,$input){
            //sets the hidden form to UTC representation of selected time
            //first parse date provided - this will be local time
            //then convert this to ISO string which will be in UTC for the server
            compose_els['time'].val(new Date($input.val()).toISOString());
        }
    });
    /* Bind listeners here */
    $('#container').on('click', '#logout', logOut)
        .on('submit', '#compose', submitEmailForm)
        .on('click', '#switch-view .btn', switchView)
        .on('click', '.delete', deleteMail)
        .on('click', '.edit', editMail);
    $('body').on('click', '#error-bar', function(){$(this).remove();});
    
    /* Callback for profile data, will pull until it gets it */
    loadProfile();
    /* TODO load profile conditionally, get stuff passed in from node */
});

/* Var declarations initialized on ready */
/* dom vars */ var view_compose, view_list, compose, list,
list_loading_text, compose_els;

/* global vars */ var mail_list, mail_list_updated, mail_list_template;

/* end clean scope */ })(jQuery);
