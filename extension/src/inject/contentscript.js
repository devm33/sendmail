/*var jquery = document.createElement('script');
jquery.onload = function(){
    this.parentNode.removeChild(this);
}
jquery.src = "//ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.min.js";
(document.head||document.documentElement).appendChild(jquery);
var script = document.createElement('script');
script.onload = jquery.onload;
script.src = chrome.extension.getURL('src/inject/inject.js');
(document.head||document.documentElement).appendChild(script);*/
//TODO Clean up class names that are Gmail specific -- perhaps copycat and use our our classes and styles. will be harder to fix selection...
var handleSendRowChanges = function(summaries){
    var rowSummary = summaries[0];
    rowSummary.added.forEach(function(newRow){
        $(newRow).children("td:last-child").before(
            '<td class="gU Up"><div class="J-J5-Ji">'
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
            '<div class="G-Ni J-J5-Ji"><div id="RemindMeLaterButton" class="T-I J-J5-Ji aFk T-I-ax7 ar7 T-I-JO hover-button" style="-webkit-user-select: none;">Remind Me Later</div></div>'
        );
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
