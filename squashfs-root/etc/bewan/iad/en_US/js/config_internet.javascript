var Page = (function($, App) {
    var util = $.util, data,
    
    Messages = App.MessageUtil,
    ui_sInetPPPPwd, ui_sInetPPPLogin;
    
    
    function saveData() {
        Messages.clearAll();
        ui_sInetPPPLogin.removeClass("invalid");
        ui_sInetPPPPwd.removeClass("invalid");
        var wanIfNo = data.wanIfNo;

        if ( ui_sInetPPPLogin.val() == '') {
                Messages.error('User ID must not be empty');
                ui_sInetPPPLogin.addClass("invalid");
            return ;
        }

        if ( ui_sInetPPPPwd.val() == '') {
                Messages.error('Password must not be empty');
                ui_sInetPPPPwd.addClass("invalid");
            return ;
        }

        cli.rollback()
            .write("WANConnectionDevice_" + wanIfNo + "_WANPPPConnection_Username", ui_sInetPPPLogin.val())
            .encrypt("WANConnectionDevice_" + wanIfNo + "_WANPPPConnection_Password", ui_sInetPPPPwd.val())
            .commit(function(res) {
                if(res.error) {
                    Messages.error(res.error);
                }else {
                    Messages.info('Internet configuration successfully saved.');
                }
            });
    }

    function cancelData() {
        Messages.clearAll();
        ui_sInetPPPLogin.removeClass("invalid");
        ui_sInetPPPPwd.removeClass("invalid");
        ui_sInetPPPLogin.val(data.sInetPPPLogin);
        ui_sInetPPPPwd.val(data.sInetPPPPwd);
    }
    
    
    function initUI() {
        ui_sInetPPPLogin = $("#ui_sInetPPPLogin");
        ui_sInetPPPPwd = $("#ui_sInetPPPPwd");
        
        ui_sInetPPPLogin.val(data.sInetPPPLogin);
        ui_sInetPPPPwd.val(data.sInetPPPPwd);
        
        $("#save").bind("click", function() {
            saveData();
        });
        $("#cancel").bind("click", function() {
            cancelData();
        });
    }
    
    return {
        init: function(pageData) {
            data = pageData;
            cli = ConfigAccess(data.token);
            initUI();
        }
    };
})(lite, App);