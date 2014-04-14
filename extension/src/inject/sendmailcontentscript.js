var authenticated = function() {
    alert("You are now authenticated! Proceed to GMail to use the SendMail Extension");
    //TODO make this a bit cleaner, and also alert user that they will need to refresh any active gmail sessions
};

var handleKeyInsertion = function(summaries){
    var keyInsertionSummary = summaries[0];
    keyInsertionSummary.added.forEach(function(info){    
        var user = $(info).data();
        chrome.storage.local.set({"user": user}, authenticated);
    });
};

var keyInsertionObserver = new MutationSummary({
    callback: handleKeyInsertion,
    queries: [{
        element: "#ExtensionInfo"
    }]
});


