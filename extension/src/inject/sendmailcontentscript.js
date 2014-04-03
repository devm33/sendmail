var authenticated = function() {
    alert("You are now authenticated! Proceed to GMail to use the SendMail Extension");
};

var handleKeyInsertion = function(summaries){
    var keyInsertionSummary = summaries[0];
    keyInsertionSummary.added.forEach(function(info){    
        var user = new Object();
        user.name = $(info).data("email");
        user.key = $(info).data("key");
        chrome.storage.local.set({"user": user}, authenticated);
    });
};

var keyInsertionObserver = new MutationSummary({
    callback: handleKeyInsertion,
    queries: [{
        element: "#ExtensionInfo"
    }]
});


