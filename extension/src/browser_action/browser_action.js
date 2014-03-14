$(document).ready(function(){
    var reload = function(){
        window.location.reload(true);
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
        //TODO sign in yo!
        var user = new Object();
        user.name = "dave32392@gmail.com";
        user.id = "testID";
        chrome.storage.local.set({"user": user}, reload);
        reload();
    });
});
