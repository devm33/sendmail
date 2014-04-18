$(document).ready(function(){
    $(document).tooltip({
        track: true,
        items: "#Help, [title]",
        content: function(callback){ 
            if($(this).attr("title")){
                return $(this).attr("title");
            }
            else if($(this).attr("id") == "Help"){
                return '<ul class="list"><li>"Sign in with Google" will take you to the main page of the website.</li><li>After you sign in, you will be presented with a standard form in which you can compose an email message to be sent at a later time.</li><li>At the top of the page, you will also see a toggle button to change between the "Compose" screen and "Scheduled" screen.</li><li>The "Scheduled" screen presents you with a list of all scheduled events</li><li>You can click "edit" or "delete" to change any scheduled items.</li></ul>';
            }
        }
    });
});
