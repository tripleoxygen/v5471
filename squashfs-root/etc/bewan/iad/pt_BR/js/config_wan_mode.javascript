var Page = (function($, App) {
    var data, cli, Messages = App.MessageUtil, updates = {};
    
    function setPhyInt(val) {
        //console.dir(data.WANConnectionDevice);
        var WCD =  data.WANConnectionDevice;
        for (var i = 1 ; i <= WCD.Count; i++) {
            if ( WCD[i].PhysicalInterface.List == "") continue;
            var list = WCD[i].PhysicalInterface.List.split(",");
            for (var j in list) {
                var WCDType = WCD[i].PhysicalInterface[list[j]].Type;
                if (WCDType === "ATMEthernetInterface" || WCDType === "PTMEthernetInterface" || WCDType === "WANEthernetInterface") {
                    updates["WANConnectionDevice_"+i+"_PhysicalInterface_"+list[j]+"_Enable"] = val;
                }
            }
        }
    }

//updates["Services_DynDNS_" + currDnsId + "_Password"] = ConfigAccess.encrypt(data.token, val);
    
    function initUI() {
        var wanAccess ,uiWanAccess = $("#WANAccess_Type");
        
        if (data.WANAutoConfig == '1') {
            wanAccess = 'Auto';
        } else if (data.WANDSLInterfaceConfig == '1'){
            wanAccess = 'DSL';
        } else if (data.WANEthernetInterface == '1'){
            wanAccess = 'Ethernet';
        }
        uiWanAccess.val(wanAccess);
        if (uiWanAccess.val() == "DSL") {
            $("#WANEthModeLine").addClass("none");
        } else {
            $("#WANEthModeLine").removeClass("none");
        }
        
        $("#Services_GvtConfig_WANEthMode").val(data.WANEthMode);

        if (data.AssociatedConnection == '1' ) {
            $("#Bridge_Mode").val('Bridge');
        } else {
            $("#Bridge_Mode").val('Router');
        }

        uiWanAccess.bind("change", function() {
            if (uiWanAccess.val() == "DSL") {
                $("#WANEthModeLine").addClass("none");
            } else {
                $("#WANEthModeLine").removeClass("none");
            }
        });

        $("#save").bind("click", function() {
            Messages.clearAll();
            
            var newWanAccess = uiWanAccess.val();
            newWanAccess === "Auto" ? setPhyInt (0) : setPhyInt (1);
    
            if ( newWanAccess !== "DSL" ) {
                updates["Services_GvtConfig_WANEthMode"] = $("#Services_GvtConfig_WANEthMode").val();
            }

            cli.rollback().write(updates).write({
                Services_WANAutoConfig_Enable: newWanAccess === "Auto" ? 1 : 0,
                WANDSLInterfaceConfig_Enable: newWanAccess === "DSL" || newWanAccess === "Auto" ? 1 : 0,
                WANEthernetInterface_1_Enable: newWanAccess === "Ethernet" || newWanAccess === "Auto" ? 1 : 0
            }).commit(function(res) {
                if(res.error) {
                    Messages.error(res.error);
                }else {
                    if (newWanAccess === "Auto" ) {
                        Messages.info('WAN Mode successfully changed. Please reboot your gateway.');
                    } else {
                        Messages.info('Modo da WAN alterado com sucesso.');
                    }
                }
            });
            updates = {};
        });

        $("#save2").bind("click", function() {
            Messages.clearAll();
            var BridgeMode = $("#Bridge_Mode").val();
            var Enabled = false;
            var AssociatedCon = '';
            if (BridgeMode === "Bridge") {
                Enabled = true;
                AssociatedCon = 1
            }
            
            cli.rollback().write(updates).write({
                LANDevice_1_HostConfig_AssociatedConnection: AssociatedCon,
                LANDevice_1_HostConfig_DHCPServerEnable: Enabled ? 0:1,
                WANConnectionDevice_1_WANPPPConnection_Enable: Enabled ? 0:1,
                WANConnectionDevice_1_WANIPConnection_Enable : 0,
                WANConnectionDevice_1_WANIP6Connection_Enable : Enabled ? 0:1,
                WANConnectionDevice_2_Enable: Enabled ? 0:1,
                WANConnectionDevice_3_Enable: Enabled ? 0:1,
                WANConnectionDevice_4_Enable: Enabled ? 0:1,
            }).commit(function(res) {
            if(res.error) {
                Messages.error(res.error);
            }else {
                if (BridgeMode === "Bridge") {
                    Messages.info('Modo Bridge aplicado com sucesso.');
                } else {
                    Messages.info('Router Mode successfully applied.');
                }
            }
        });
        updates = {};
        });

        $("#cancel").bind("click", function() {
            Messages.clearAll();
            updates = {};
            uiWanAccess.val(wanAccess);
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