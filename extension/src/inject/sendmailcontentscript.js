var getUserDataCallback = function(userDataItem){
//Little debate here as to how to handle this, but basically we are only grabbing credentials from sendmail IF our extension is NOT signed in. At first I wanted it to grab lastest credentials for any signin to SendMail, but that's actually probably a bad idea (no longer is in response to direct user action -- what if I sigin into SendMail on my buddy's computer? He snags my credentials in his extension -- BAD!) This way requires the user to actively signin/signout using the extension browser action (the button in the corner)
//TODO maybe only send down a key to snag from server side if user took the extensionauth route. otherwise, the scenario described above can still happen if the extension is logged out
    if(!userDataItem.user){
var authenticated = function() {
    $("#ExtensionDialog").dialog("open");
};

//Since we are loading this async, the insertion on callback of "loadProfile" may have happened. If so, grab credentials now, otherwise set up a mutation observer
var $info = $("#ExtensionInfo");
if($info.length > 0){
    chrome.storage.local.set({"user": $info.data()}, authenticated);
}
else{
    var handleKeyInsertion = function(summaries){
        var keyInsertionSummary = summaries[0];
        keyInsertionSummary.added.forEach(function(info){    
            chrome.storage.local.set({"user": $(info).data()}, authenticated);
        });
    };

    var keyInsertionObserver = new MutationSummary({
        callback: handleKeyInsertion,
        queries: [{
            element: "#ExtensionInfo"
        }]
    });
}
    }
};

$("body").append("<div id='ExtensionDialog'><div class='smaller-dialog-content'>You have authenticated your SendMail Extension. Please refresh any active GMail tabs for changes to be seen. You can now navigate to GMail to use the extension or use our website to create new messages and view scheduled events.</div></div>");
$("#ExtensionDialog").dialog({
    autoOpen: false,
    modal: true,
    minWidth: 400,
    buttons: [
        {
            text: "Proceed to GMail.com",
            click: function() { window.location = "https://mail.google.com"; }
        },
        {
            text: "Proceed to SendMail.com",
            click: function() { $(this).dialog("close");}
        }
    ]
});

chrome.storage.local.get("user", getUserDataCallback);
