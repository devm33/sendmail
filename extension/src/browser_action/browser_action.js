$(document).ready(function(){
    var getUserDataCallback = function(userDataItem){
        if(userDataItem.user){
            $("#SignInButton").hide();
            $("#Username").text(userDataItem.user.name);
        }
        else{
            $("#SignedInPrompt").hide();
        }
    }
    chrome.storage.local.get("user", getUserDataCallback);
    $("#SignOutLink").on("click", function(){
        chrome.storage.local.set({"user": null}, reload);
    });
    $("#SignInButton").on("click", function(){
        /*sign in yo!*/
        var createProperties = new Object();
        createProperties.url = config.url; 
        chrome.tabs.create(createProperties);
    });
});
