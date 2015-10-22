var Page = (function($, App) {
    var data, cli;
    var util = $.util;
    var updates = {};
    var Messages = App.MessageUtil;
   
    function switchFormatter(val, ctx) {
        var fld = ctx.field;
        if(ctx.operation === "read") {
            return fld.attr("state");
        }else {
            fld.attr("state", val);
            if (val == "0" ) {
                fld.setStyle({'backgroundPosition': '-34px'});
            } else {
                fld.setStyle({'backgroundPosition': '0px'});
            }
            return null;
        }
    }

    function setupBinders() {
        usbConfigBinder = App.DataBinder({
            fields: [
                "Services_Samba_Enable",
                "Services_Ippos_Enable",
                "Services_SuperDLNA_Enable"
            ],
            formatters: {
                "Services_Samba_Enable": switchFormatter,
                "Services_Ippos_Enable": switchFormatter,
                "Services_SuperDLNA_Enable": switchFormatter,
            }, 
        });
    }

    function initUI() {
        setupBinders();
        usbConfigBinder.write({
            data: data
        });

        $(".switchButton").bind("click", function() {
            var id = $("#"+this.id);
            if (id.attr("state") == 0 ) {
                morpheus(id.elements[0], { duration:300, backgroundPosition: '0px'});
                id.attr("state", 1);
            } else {
                morpheus(id.elements[0], { duration:300, backgroundPosition: '-34px'});
                id.attr("state", 0);
            }
            usbConfigBinder.serialize({
                target: updates,
            }, this.id);

        });

        $("#saveFiles").bind("click", function() {
            Messages.clearAll();
            cli.rollback().write(updates).commit(function(res) {
                if(cli.error) {
                    Messages.error(res.error);
                }else {
                    updates = {};
                    Messages.info('File sharing configuration successfully saved.');
                }
            });
        });

        $("#cancelFiles").bind("click", function() {
            Messages.clearAll();
            updates = {};
            usbConfigBinder.write({
                data: data
            });
        });

        $("#savePrint").bind("click", function() {
            Messages.clearAll();
            cli.rollback().write(updates).commit(function(res) {
                if(cli.error) {
                    Messages.error(res.error);
                }else {
                    updates = {};
                    Messages.info('Printers configuration successfully saved.');
                }
            });
        });

        $("#cancelPrint").bind("click", function() {
            Messages.clearAll();
            updates = {};
            usbConfigBinder.write({
                data: data
            });
        });

        $("#saveDLNA").bind("click", function() {
            Messages.clearAll();
            cli.rollback().write(updates).commit(function(res) {
                if(cli.error) {
                    Messages.error(res.error);
                }else {
                    updates = {};
                    Messages.info('DLNA configuration successfully saved.');
                }
            });
        });

        $("#cancelDLNA").bind("click", function() {
            Messages.clearAll();
            updates = {};
            usbConfigBinder.write({
                data: data
            });
        });


        $("#menu-configUSB").find("a").bind("click", function(){
            Messages.clearAll();
            updates = {};
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