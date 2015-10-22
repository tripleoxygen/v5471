var Page = (function($, App) {
    var data, cli, util = $.util, net = $.net,
    
        Messages = App.MessageUtil,
        uiResetPanel,
        uiMessagePanel;
    
    function initUI() {
        uiResetPanel = $("#resetPanel");
        uiMessagePanel = $("#messagePanel");
        
        $("#confirmReset").bind("click", function() {
            $("#confirm-reboot").addClass("none");
            $("#confirm-reset").removeClass("none");
            $("#confirm-bg").removeClass("none");
        });
        $("#cancelReset").bind("click", function() {
            $("#confirm-reset").addClass("none");
            $("#confirm-bg").addClass("none");
        });
        
        $("#confirmReboot").bind("click", function() {
            $("#confirm-reset").addClass("none");
            $("#confirm-reboot").removeClass("none");
            $("#confirm-bg").removeClass("none");
        });
        $("#cancelReboot").bind("click", function() {
            $("#confirm-reboot").addClass("none");
            $("#confirm-bg").addClass("none");
        });
        
        $("#confirm-bg").bind("click", function() {
            $("#confirm-reset").addClass("none");
            $("#confirm-reboot").addClass("none");
            $("#confirm-bg").addClass("none");
        });

        $(".confirm-close").bind("click", function() {
            $("#confirm-reset").addClass("none");
            $("#confirm-reboot").addClass("none");
            $("#confirm-bg").addClass("none");
        });
        
        $("#reboot").bind("click", function() {
            cli.rollback().fct("reboot").commit(function(res) {
                if(res.error) {
                    Messages.error(res.error);
                    return;
                }
                showMessage("reboot");
            });
        });
        
        $("#reset").bind("click", function() {
            cli.rollback().fct("factoryReset").commit(function(res) {
                if(res.error) {
                    Messages.error(res.error);
                    return;
                }
                showMessage("reset");
            });
        });
    }
    
    
    function showMessage(type) {
        var str = type === 'reboot' ? 'Reinicializando' : 'Restaurando configurações de fábrica';
        uiMessagePanel.find("h3.bloc_header").html(str);
        
        uiResetPanel.addClass("none");
       $("#confirm-reset").addClass("none");
       $("#confirm-reboot").addClass("none");
        uiMessagePanel.removeClass("none");

        console.log("Starting poll...");
        window.setTimeout(poll, 15000);
    }
    
    function poll() {
        net.ajax({
            url: "/cgi-bin/generic.cgi",
            timeout: 100, // milliseconds
            onTimeout: function() {
                console.log("Trying again in next 15 seconds.");
                window.setTimeout(poll, 15000);
            },
            onSuccess: function() {
                window.location.href = '/';
            },
            onError: function() {
                console.log('Erro ao amostrar dados.');
            }
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


