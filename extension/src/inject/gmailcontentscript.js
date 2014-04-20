//TODO Clean up class names that are Gmail specific -- perhaps copycat and use our our classes and styles. will be harder to fix selection...
var getUserDataCallback = function(userDataItem){
    if(userDataItem.user){

var datepickerLogic = function(currentDateTime, picker){
    if(currentDateTime){
        if(currentDateTime.toDateString() === new Date().toDateString()){
            picker.setOptions({
                minTime: 0 //now
            });
        }else{
            picker.setOptions({
                minTime:'0:00'
            });
        }
    }
};

var initDateTimePicker = function($picker){
    $picker.datetimepicker({
        lang: 'en',
        step:30,
        mask:true,
        format: "Y/m/d H:i",
        minDate: 0,
        onChangeDateTime: function(currentDateTime, $input){
            datepickerLogic(currentDateTime, this);
        },
        onShow: function(currentDateTime, $input){
            datepickerLogic(currentDateTime, this);
        }
    });
};

var initDialog = function($dialog, submitButtonId, cancelButtonId, submitClickListener){
    $dialog.dialog({ 
        autoOpen: false,
        modal: true,
        minWidth: 350,
        closeOnEscape: false,
        buttons: [
            { 
                id: submitButtonId,
                text: "Schedule",
                click: submitClickListener
            },
            {
                id: cancelButtonId,
                text: "Cancel",
                click: function() { $(this).dialog("close");}
            }
        ]
    });
};

var submitSendLaterDialog = function(){
    var submitButton = $("#SendLaterDialogSubmitButton");
    var cancelButton = $("#SendLaterDialogCancelButton");
    var dateTimeField = $("#SendLaterDateTimePicker");
    var dialog = $("#SendLaterDialog");
    var dateTime;
    try{
        //sets the hidden form to UTC representation of selected time
        //first parse date provided - this will be local time
        //then convert this to ISO string which will be in UTC for the server
        dateTime = (new Date(dateTimeField.val()).toISOString());
    }catch(err){
        //format wrong because either blank or user manipulated
        dateTime = "";
    }
    submitButton.button("option", "disabled", true).button("option", "label", "Please Wait...").button("option", "icons", { primary: "ui-icon-spinner", secondary: null });
    cancelButton.button("option", "disabled", true);
    dateTimeField.prop("disabled", true);
    $.ajax({
        url: config.url + config.schedule,
        type: 'POST',
        dataType: 'json',
        data: {
            "subject": $('input[name="subject"]').val(),
            "to": $('input[name="to"]').map(function(){ return this.value; }).get().join(", "), 
            "from": $('input[name="from"]').val(), 
            "body": $('input[name="body"]').val(),
            "time": dateTime,
            "key": userDataItem.user.key
        }, 
        success: function(data, status, xhr) {
            //This is the discard button. Seems to be the best way to force gmail to close and disregard the message
            $(".og.T-I-J3").click();
            $(".b8.UC>.J-J5-Ji>.vh").html("E-mail successfully scheduled.");
        },
        error: function(xhr, status, code) {
            alert('There was an error scheduling your email: '+
                ($.parseJSON(xhr.responseText).message || code));
        },
        complete: function(xhr, status){
            submitButton.button("option", "disabled", false).button("option", "label", "Schedule Reminder").button("option", "icons", { primary: null, secondary: null });
            cancelButton.button("option", "disabled", false);
            dateTimeField.prop("disabled", false);
            dialog.dialog("close");
        }
    });
};

var submitRemindMeLaterDialog = function(){
    var submitButton = $("#RemindMeLaterDialogSubmitButton");
    var cancelButton = $("#RemindMeLaterDialogCancelButton");
    var dateTimeField = $("#RemindMeLaterDateTimePicker");
    var dialog = $("#RemindMeLaterDialog");
    var dateTime;
    try{
        //sets the hidden form to UTC representation of selected time
        //first parse date provided - this will be local time
        //then convert this to ISO string which will be in UTC for the server
        dateTime = (new Date(dateTimeField.val()).toISOString());
    }catch(err){
        //format wrong because either blank or user manipulated
        dateTime = "";
    }
    submitButton.button("option", "disabled", true).button("option", "label", "Please Wait...").button("option", "icons", { primary: "ui-icon-spinner", secondary: null });
    cancelButton.button("option", "disabled", true);
    dateTimeField.prop("disabled", true);
    $.ajax({
        url: config.url + config.remind,
        type: 'POST',
        dataType: 'json',
        data: {
            "key": userDataItem.user.key,
            "time": dateTime, 
            "gmid": window.location.href.split("/").pop(),
            "subject": $("h2.hP").text()
            //it seems as if the gmail id is always the last element in the URL. should probably be careful with that assumption, maybe parsing this a little more robustly, but haven't been able to find a case where this isn't true
        }, 
        success: function(data, status, xhr) {
            $(".b8.UC>.J-J5-Ji>.vh").html("Reminder successfully scheduled.");
            $(".b8.UC").css("visibility", "visible");
            setTimeout(function(){ $(".b8.UC").css("visibility", "hidden"); }, 1500);
        },
        error: function(xhr, status, code) {
            alert('There was an error scheduling your reminder: '+
                ($.parseJSON(xhr.responseText).message || code));
        },
        complete: function(xhr, status){
            submitButton.button("option", "disabled", false).button("option", "label", "Schedule Reminder").button("option", "icons", { primary: null, secondary: null });
            cancelButton.button("option", "disabled", false);
            dateTimeField.prop("disabled", false);
            dialog.dialog("close");
        }
    });
};

var handleSendRowChanges = function(summaries){
    //TODO genericize this so that multiple send later buttons/dialogs can exist w/o bugs
    var rowSummary = summaries[0];
    rowSummary.added.forEach(function(newRow){
        $(newRow).children("td:last-child").before(
            '<td class="gU Up"><div class="J-J5-Ji">'
            + '<div id="SendLaterButton" class="T-I J-J5-Ji aoO T-I-atl L3 hover-button" style="-webkit-user-select: none;">Send Later</div>'
            + '<div id="SendLaterDialog" title="When would you like the message to send?" style="text-align:center;">'
            + '<input id="SendLaterDateTimePicker" type="text">'
            + '</div>'
            + '</div></td>'
        );
    });
    initDateTimePicker($("#SendLaterDateTimePicker"));
    initDialog($("#SendLaterDialog"), "SendLaterDialogSubmitButton", "SendLaterDialogCancelButton", submitSendLaterDialog);
};

var sendLaterObserver = new MutationSummary({
    callback: handleSendRowChanges,
    queries: [{
        element: ".n1tfz"
    }]
});

var handleMessageHeaderRowChanges = function(summaries){
    var rowSummary = summaries[0];
    rowSummary.added.forEach(function(newRow){
        $(newRow).prepend(
            '<div class="G-Ni J-J5-Ji">'  
            + '<div id="RemindMeLaterButton" class="T-I J-J5-Ji aFk T-I-ax7 ar7 T-I-JO hover-button" style="-webkit-user-select: none;">Remind Me Later</div></div>'
            + '<div id="RemindMeLaterDialog" title="When would you like to be reminded?" style="text-align:center;">'
            + '<input id="RemindMeLaterDateTimePicker" type="text">'
            + '</div>'
        );
        initDateTimePicker($("#RemindMeLaterDateTimePicker"));
        initDialog($("#RemindMeLaterDialog"), "RemindMeLaterDialogSubmitButton", "RemindMeLaterDialogCancelButton", submitRemindMeLaterDialog);
    });
};

var remindMeObserver = new MutationSummary({
    callback: handleMessageHeaderRowChanges,
    queries: [{
        element: ".adF"
    }]
});

//fix for hover style on inserted button
$(document).on({
    mouseenter: function () {
        $(this).toggleClass("T-I-JW", true);
    },
    mouseleave: function () {
        $(this).toggleClass("T-I-JW", false);
    }
}, ".hover-button");

//Listener's for the new buttons
$(document).on("click", "#RemindMeLaterButton", function(){
    $("#RemindMeLaterDialog").dialog("open");
});
$(document).on("click", "#SendLaterButton", function(){
    $("#SendLaterDialog").dialog("open");
});
    }
}
chrome.storage.local.get("user", getUserDataCallback);
