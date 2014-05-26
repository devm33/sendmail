$(document).ready(function(){
    $(document).tooltip({
        track: true,
        items: ".tooltip",
        content: function(callback){ 
            return "<div class='smaller-content'>" + $(this).attr("title") + "</div>";
        }
    });
    $("#HelpDialog").dialog({
        autoOpen: false,
        minWidth: 400,
        modal: true
    });
    $("#Help").click(function() {
        $("#HelpDialog").dialog("open");
    });
});
