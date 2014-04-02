$(document).ready(function(){
    var reload = function(){
        location.reload(true);
    }
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
        createProperties.url = "https://sendmail4911.herokuapp.com/extensionauth";
        chrome.tabs.create(createProperties);
    });
});
