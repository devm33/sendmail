$(document).ready(function(){
    var reload = function(){
        location.reload(true);
    };
    var getUserDataCallback = function(userDataItem){
        if(userDataItem.user){
            $("#SignInButton").hide();
            $("#Username").text(userDataItem.user.email);
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
        chrome.tabs.create({'url':config.url + config.extensionauth});
    });
});
