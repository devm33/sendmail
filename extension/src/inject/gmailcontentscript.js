//TODO Clean up class names that are Gmail specific -- perhaps copycat and use our our classes and styles. will be harder to fix selection...
var getUserDataCallback = function(userDataItem){
    if(userDataItem.user){
var submitRemindMeLaterDialog = function(){
    var submitButton = $("#RemindMeLaterDialogSubmitButton");
    var cancelButton = $("#RemindMeLaterDialogCancelButton");
    var dateTimeField = $("#RemindMeLaterDateTimePicker");
    var dialog = $("#RemindMeLaterDialog");
    submitButton.button("option", "disabled", true).button("option", "label", "Please Wait...").button("option", "icons", { primary: "ui-icon-spinner", secondary: null });
    cancelButton.button("option", "disabled", true);
    dateTimeField.prop("disabled", true);
    $.ajax({
        url: config.url + config.remind,
        type: 'POST',
        dataType: 'json',
        data: {
            "key": userDataItem.user.key,
            "time": dateTimeField.val().replace(/\//g, '-').replace(' ', 'T').concat(':00'), 
            "subject": $("h2.hP").text()
            //TODO make this more robust query for greater accuracy and specificity -- select with greater fieldset then just "subject"
        }, 
        success: function(data, status, xhr) {
            //TODO handle prettier and also archive message in mean time
            alert("Scheduled!");
        },
        error: function(xhr, status, code) {
            alert('There was an error scheduling your reminder: '+
                (xhr.responseText || code));
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
    var rowSummary = summaries[0];
    rowSummary.added.forEach(function(newRow){
        $(newRow).children("td:last-child").before(
            '<td class="gU Up"><div class="J-J5-Ji">'
            //+ '<input id="Time" type="datetime" value="' 
            //+ (new Date()).toJSON().slice(0,-5) 
            //+ '">'
            + '<div id="SendLaterButton" class="T-I J-J5-Ji aoO T-I-atl L3 hover-button" style="-webkit-user-select: none;">Send Later</div>'
            + '</div></td>'
        );
    });
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
            //+ '<input id="RemindTime" type="datetime" value="' 
            //+ (new Date()).toJSON().slice(0,-5) 
            //+ '">' 
            + '<div id="RemindMeLaterButton" class="T-I J-J5-Ji aFk T-I-ax7 ar7 T-I-JO hover-button" style="-webkit-user-select: none;">Remind Me Later</div></div>'
            + '<div id="RemindMeLaterDialog" title="When would you like to be reminded?" style="text-align:center;">'
            + '<input id="RemindMeLaterDateTimePicker" type="text">'
            + '</div>'
        );
        $("#RemindMeLaterDateTimePicker").datetimepicker({
            lang: 'en',
            step:30,
            mask:true,
            format: "Y/m/d H:i",
            minDate: 0,
            minTime: 0
        });
        $("#RemindMeLaterDialog").dialog({ 
            autoOpen: false,
            modal: true,
            minWidth: "350",
            closeOnEscape: false,
            buttons: [
                { 
                    id: "RemindMeLaterDialogSubmitButton",
                    text: "Schedule Reminder",
                    click: submitRemindMeLaterDialog
                },
                {
                    id: "RemindMeLaterDialogCancelButton",
                    text: "Cancel",
                    click: function() { $(this).dialog("close");}
                }
            ]
        });
    });
};

var remindMeObserver = new MutationSummary({
    callback: handleMessageHeaderRowChanges,
    queries: [{
        element: ".adF"
    }]
});

//for when page loads with ".n1tfz"
/* TODO make this work for pop-out window
$(document).ready(function(){
    var beginningRow = new Object();
    beginningRow.added = $(".n1tfz").toArray();
    //handleSendRowChanges([beginningRow]);
});
*/

//fix for more options menu
/* TODO make this work
$(document).on({
    mouseenter: function () {
        $("#SendLaterButton").hide();
    },
    mouseleave: function () {
        $("#SendLaterButton").show();
    }
}, 'div[data-tooltip="Insert more menu"]');
*/

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
    $.ajax({
        url: config.url + config.schedule,
        type: 'POST',
        dataType: 'json',
        data: {
            "subject": $('input[name="subject"]').val(),
            "to": $('input[name="to"]').map(function(){ return this.value; }).get().join(", "), 
            "from": $('input[name="from"]').val(), 
            "body": $('input[name="body"]').val(),
            "time": $('#Time').val(),
            "key": userDataItem.user.key
        }, 
        success: function(data, status, xhr) {
            //This is the discard button. Seems to be the best way to force gmail to close and disregard the message
            $(".og.T-I-J3").click();
            $(".b8.UC>.J-J5-Ji>.vh").html("E-mail successfully scheduled.");
        },
        error: function(xhr, status, code) {
            alert('There was an error scheduling your email: '+
                (xhr.responseText || code));
        }
    });
});
    }
}
chrome.storage.local.get("user", getUserDataCallback);
