var Page = (function($, App) {
   var util = $.util, pageData, config,
      lanEthernetBinder;
   
   /* --------------------------------- Utility functions --------------------------------------- */
   function numVal(val/*, defaultVal */) {
      var defaultValue = arguments[2] || 0;
      val = Number(val);
      return isNaN(val) ? defaultValue : val;
   }
   
   function defaultIp(value) {
      return value || "0.0.0.0";
   }

   function asSec(val) {
      return val + " s";
   }
   
   function asKbps(val) {
      return val + " Kbps";
   }
   
   function asDb(val) {
      return (Math.round(numVal(val))/10).toFixed(1) + " dB";
   }
   
   function asdb(val) {
      return (Math.round(numVal(val))/10).toFixed(1) + " db";
   }
   
   function asMs(val) {
      return (Math.round(numVal(val))/10).toFixed(1) + " ms";
   }
   
   function asDbm(val) {
      return (Math.round(numVal(val))/10).toFixed(1) + " dBm";
   }

   function percError(err, tot) {
        var res = 0.0;
        if (tot != 0) { 
            res = (parseInt(err)/parseInt(tot)) * 100 ;
        }
        return res;
    }
   
   /* ------------------------------------- LANEthernet Details ----------------------------------------- */
   
   function showLANEthernetInterface(lanData) {
      lanEthernetBinder.write({
         data: lanData
      });
        for (var i = 1; i <= 4 ; i++) {
            $("#PercentageReceiveErr_"+i).html(percError($("#Switch_2_Port_"+i+"_Counters_RxPacketsErrors").html(),  $("#Switch_2_Port_"+i+"_Counters_RxPackets").html()));
            $("#PercentageSendErr_"+i).html(percError($("#Switch_2_Port_"+i+"_Counters_TxPacketsErrors").html(),  $("#Switch_2_Port_"+i+"_Counters_TxPackets").html()));
        }
   }

   function initEthBinders() {
      /* --------------------------------------------- Binder for LanEthernet details --------------------------------------- */
      lanEthernetBinder = App.DataBinder({
         fields:[
            "Switch_2_Port_1_Counters_RxPackets",
            "Switch_2_Port_2_Counters_RxPackets",
            "Switch_2_Port_3_Counters_RxPackets",
            "Switch_2_Port_4_Counters_RxPackets",
            "Switch_2_Port_1_Counters_TxPackets",
            "Switch_2_Port_2_Counters_TxPackets",
            "Switch_2_Port_3_Counters_TxPackets",
            "Switch_2_Port_4_Counters_TxPackets",
            "Switch_2_Port_1_Counters_RxBytes",
            "Switch_2_Port_2_Counters_RxBytes",
            "Switch_2_Port_3_Counters_RxBytes",
            "Switch_2_Port_4_Counters_RxBytes",
            "Switch_2_Port_1_Counters_TxBytes",
            "Switch_2_Port_2_Counters_TxBytes",
            "Switch_2_Port_3_Counters_TxBytes",
            "Switch_2_Port_4_Counters_TxBytes",
            "Switch_2_Port_1_Counters_RxPacketsErrors",
            "Switch_2_Port_2_Counters_RxPacketsErrors",
            "Switch_2_Port_3_Counters_RxPacketsErrors",
            "Switch_2_Port_4_Counters_RxPacketsErrors",
            "Switch_2_Port_1_Counters_TxPacketsErrors",
            "Switch_2_Port_2_Counters_TxPacketsErrors",
            "Switch_2_Port_3_Counters_TxPacketsErrors",
            "Switch_2_Port_4_Counters_TxPacketsErrors",
            "Switch_2_Port_1_Counters_RxPacketsDiscards",
            "Switch_2_Port_2_Counters_RxPacketsDiscards",
            "Switch_2_Port_3_Counters_RxPacketsDiscards",
            "Switch_2_Port_4_Counters_RxPacketsDiscards",
            "Switch_2_Port_1_Counters_TxPacketsDiscards",
            "Switch_2_Port_2_Counters_TxPacketsDiscards",
            "Switch_2_Port_3_Counters_TxPacketsDiscards",
            "Switch_2_Port_4_Counters_TxPacketsDiscards",
         ],
         formatters: {
        }
      });
      
   }

   /* ------------------------------------- HPNA Details ----------------------------------------- */
   
    function showHPNA(lanData) {
        HPNABinder.write({
            data: lanData
        });
        $("#PercentageReceiveErr_5").html(percError($("#HPNA_Status_RxPacketsErrors").val(),$("#HPNA_Status_RxPackets").html()));
        $("#PercentageSendErr_5").html(percError($("#HPNA_Status_TxPacketsErrors").val(),$("#HPNA_Status_TxPackets").html()));
    }

    function initHPNABinders() {
        /* --------------------------------------------- Binder for HPNA details --------------------------------------- */
        HPNABinder = App.DataBinder({
            fields:[
                "HPNA_Status_RxPackets",
                "HPNA_Status_TxPackets",
                "HPNA_Status_RxBytes",
                "HPNA_Status_TxBytes",
                "HPNA_Status_RxPacketsErrors",
                "HPNA_Status_TxPacketsErrors",
            ],
            formatters: {
            }
        });
    }   

   /* ------------------------------------- Wireless Details ----------------------------------------- */
   
    function showWifi(lanData) {
        WifiBinder.write({
            data: lanData
        });

        $("#W1_ReceiveErr").html(percError($("#WLANInterface_1_Counters_RxPacketsErrors").html(),$("#WLANInterface_1_Counters_RxPackets").html()));
        $("#W2_ReceiveErr").html(percError($("#WLANInterface_2_Counters_RxPacketsErrors").html(),$("#WLANInterface_2_Counters_RxPackets").html()));
        $("#W1_SendErr").html(percError($("#WLANInterface_1_Counters_TxPacketsErrors").html(),$("#WLANInterface_1_Counters_TxPackets").html()));
        $("#W2_SendErr").html(percError($("#WLANInterface_2_Counters_TxPacketsErrors").html(),$("#WLANInterface_2_Counters_TxPackets").html()));
        fillWifiStations();
    }

    function wifiState(val) {
    if (val == 1) {
            return 'Habilitado';
        } else {
            return 'Desabilitado';
        }
    }

    function hotSpotState(val) {
        if (val == 1 && pageData.WLANConfig.Enable == 1 && ( pageData.Services.GvtHotspot.Status.BackupState == 'reachable' || pageData.Services.GvtHotspot.Status.PrimaryState == 'reachable' ) ) {
            return 'Habilitado';
        } else {
            return 'Desabilitado';
        }
    }

    function WMMPSState(val) {
        if (val == 1) {
            return 'Habilitado';
        } else {
            return 'Desabilitado';
        }
    }

    function StdState(val){
        switch (val) {
            case 'Auto' : return 'Automático'; 
            break;
            case '11b' : return '802.11b'; 
            break;
            case '11g' : return '802.11g'; 
            break;
            case '11g' : return '802.11b/g'; 
            break;
        }
    }

    function channelState(val) {
        if (val == 0) {
            return 'Automático';
        } else {
            return val;
        }
    }

   function initWifiBinders() {
      /* --------------------------------------------- Binder for HPNA details --------------------------------------- */
        WifiBinder = App.DataBinder({
        fields:[
            "WLANInterface_1_MACAddress",
            "WLANInterface_1_Counters_RxPackets",
            "WLANInterface_1_Counters_TxPackets",
            "WLANInterface_1_Counters_RxBytes",
            "WLANInterface_1_Counters_TxBytes",
            "WLANInterface_1_Counters_RxPacketsErrors",
            "WLANInterface_1_Counters_TxPacketsErrors",
            "WLANInterface_1_Counters_RxPacketsDiscards",
            "WLANInterface_1_Counters_TxPacketsDiscards",
            "WLANInterface_1_Config_SSID",
            "WLANConfig_CurrentChannel",
            "WLANConfig_Standard",
            "WLANInterface_1_Config_BeaconType",
            "WLANConfig_TxPower",
         ],
         formatters: {
            WLANConfig_Enable: wifiState,
            WLANInterface_1_WMMPSEnable: WMMPSState,
            WLANInterface_2_WMMPSEnable: WMMPSState,
            WLANConfig_Standard: StdState,
            WLANConfig_CurrentChannel: channelState
        }
        });
    }

   /* ------------------------------------- DSL Details ----------------------------------------- */
   
    function showDSL(lanData) {
        DSLBinder.write({
            data: lanData
        });
    }

    function initDSLBinders() {
        /* --------------------------------------------- Binder for HPNA details --------------------------------------- */
        DSLBinder = App.DataBinder({
            fields:[
               "WANDSLLinkStatus_DownBitrates_Actual",
               "WANDSLLinkStatus_UpBitrates_Actual",
               "WANDSLLinkStatus_DownBitrates_Max",
               "WANDSLLinkStatus_UpBitrates_Max",
               "WANDSLLinkStatus_DownLinePerfs_NoiseMargin",
               "WANDSLLinkStatus_UpLinePerfs_NoiseMargin",
               "WANDSLLinkStatus_DownLinePerfs_Attenuation",
               "WANDSLLinkStatus_UpLinePerfs_Attenuation",
               "WANDSLLinkStatus_DownLinePerfs_OutputPower",
               "WANDSLLinkStatus_UpLinePerfs_OutputPower",
               "WANDSLLinkStatus_CurrentShowtime_LocalLofs",
               "WANDSLLinkStatus_CurrentShowtime_LocalLoss",
               "WANDSLLinkStatus_CurrentShowtime_RemoteLoss",
                "WANDSLLinkStatus_CurrentShowtime_RemoteLprs",
               "WANDSLLinkStatus_CurrentShowtime_LocalFEC",
               "WANDSLLinkStatus_CurrentShowtime_RemoteFEC",
               "ATMEthernetInterface_1_Counters_TxMulticastPackets",
               "ATMEthernetInterface_1_Counters_RxMulticastPackets",
               "ATMEthernetInterface_1_Counters_RxPackets",
               "ATMEthernetInterface_1_Counters_TxPackets"
            ],
            formatters: {
                WANDSLLinkStatus_DownLinePerfs_NoiseMargin: asDb,
                WANDSLLinkStatus_UpLinePerfs_NoiseMargin :  asDb,
            }
            /*
                WANDSLLinkStatus_DownBitrates_Actual: asKbps,
                WANDSLLinkStatus_UpBitrates_Actual: asKbps,
                WANDSLLinkStatus_DownBitrates_Max: asKbps,
                WANDSLLinkStatus_UpBitrates_Max: asKbps,
                WANDSLLinkStatus_DownLinePerfs_NoiseMargin: asDb,
                WANDSLLinkStatus_UpLinePerfs_NoiseMargin :  asDb,
                WANDSLLinkStatus_DownLinePerfs_Attenuation: asDb,
                WANDSLLinkStatus_UpLinePerfs_Attenuation: asDb,
                WANDSLLinkStatus_DownLinePerfs_OutputPower: asDbm,
                WANDSLLinkStatus_UpLinePerfs_OutputPower: asDbm,
                WANDSLLinkStatus_CurrentShowtime_LocalLofs: asSec,
                WANDSLLinkStatus_CurrentShowtime_LocalLoss: asSec,
                WANDSLLinkStatus_CurrentShowtime_RemoteLoss: asSec,
                WANDSLLinkStatus_CurrentShowtime_RemoteLprs: asSec
            }
            */
        });
    }   
   /* ------------------------------------- WAN Eth Details ----------------------------------------- */
   
    function showWANEth(wanData) {
        WANEthBinder.write({
            data: wanData
        });
    }

    function initWANEthBinders(data) {
        /* --------------------------------------------- Binder for WANEth details --------------------------------------- */
        var cli = ConfigAccess(data.token);
        cli.read("Switch");
        cli.commit(onWanEthData);
    }
    function onWanEthData(res) {
        var switch_id = -1;
        var port_id = -1;
        var wancon_idx = 1;
        pageData["Switch"] = res.Switch;
        lite.util.forEach(res.Switch, function (val_switch,id_switch) {
            if (id_switch == "Count") return;
            lite.util.forEach(res.Switch[id_switch].Port, function (val_port,id_port) {
                 if (id_switch == "List") return;
                if (val_port.WANEthernetInterfaceIdx == wancon_idx) {
                    switch_id = id_switch;
                    port_id = id_port;
                    return {};
                }
            });
            if (port_id != -1) return {};
        });

        lite.util.forEach($(".setupWifiTable.waneth_counters tbody td").elements, function (param) {
            if (/Switch_X_Port_Y_Counters_/.test(param.id))
                param.id = param.id.replace("_X_", "_" + switch_id + "_");
                param.id = param.id.replace("_Y_", "_" + port_id + "_");
                
        });

        WANEthBinder= App.DataBinder({
            fields:[
               "Switch_" + switch_id + "_Port_" + port_id + "_Counters_RxPackets",
               "Switch_" + switch_id + "_Port_" + port_id + "_Counters_RxPacketsErrors",
               "Switch_" + switch_id + "_Port_" + port_id + "_Counters_RxPacketsDiscards",
               "Switch_" + switch_id + "_Port_" + port_id + "_Counters_TxPackets",
               "Switch_" + switch_id + "_Port_" + port_id + "_Counters_TxPacketsErrors",
               "Switch_" + switch_id + "_Port_" + port_id + "_Counters_TxPacketsDiscards",
               "Switch_" + switch_id + "_Port_" + port_id + "_Counters_RxBytes",
               "Switch_" + switch_id + "_Port_" + port_id + "_Counters_TxBytes",
               "Switch_" + switch_id + "_Port_" + port_id + "_Counters_RxMulticastPackets",
               "Switch_" + switch_id + "_Port_" + port_id + "_Counters_TxMulticastPackets",
            ],
            formatters: {
            }
        });
        var err = pageData.Switch[switch_id].Port[port_id].Counters.RxPacketsErrors;
        var tot = pageData.Switch[switch_id].Port[port_id].Counters.RxPackets;

        $("#Switch_" + switch_id + "_Port_" + port_id + "_Counters_RxPercent").html(((parseInt(err)/parseInt(tot)) * 100).toFixed(1));
        err = pageData.Switch[switch_id].Port[port_id].Counters.TxPacketsErrors;
        tot = pageData.Switch[switch_id].Port[port_id].Counters.TxPackets;
        $("#Switch_" + switch_id + "_Port_" + port_id + "_Counters_TxPercent").html(((parseInt(err)/parseInt(tot)) * 100).toFixed(1));
        $("#wan_max_rate").html(parseInt(pageData.Switch[switch_id].Port[port_id].Status.LinkMode));
        $("#wan_mode").html(pageData.WANAutoConfig.Enable == "1" ? 'Automático' : 'Manual');
        showWANEth(pageData);
    }
/* get the value in template and returns the field value value from obj */
    function getValue(obj, str) {
        var strTab = str.split(".");
        var elm;
        var ret = obj;
        for (elm in strTab) {
            ret = ret[strTab[elm]];
        } 
    return ret;
    }
        /* 
        apply tpl template to display obj
        obj_def : contains a dictionary that allows you to set another 
    */
    function applyTemplate(tpl, obj_def, obj) {
        var elm_data = $(tpl).html().trim();
        var elm_reg = /{{([^}]+)}}/g;
        var tab_elm = elm_data.match(elm_reg);
        var elm_val;
        
        for (elm_val in tab_elm) {
            var token = tab_elm[elm_val].replace(elm_reg, "\$1");
            var value = getValue(obj, token);
            if (value != undefined) {
                var def_name;
                for (def_name in obj_def) {
                    // use another field if not null
                    if (token == def_name) value = (obj[obj_def[def_name]] != "") ? obj[obj_def[def_name]]: obj[def_name]; 
                }
            } else {
                // custom value to insert
                value = obj_def[token];
            }
            elm_data = elm_data.replace("{{" + token + "}}", value);
        }
        return elm_data;
    }
    
    function fillWifiStations() {
        var dhcp_stations = pageData.DCHPHosts;
        var wifi_stations = pageData.WIFIHosts;
        var elm_wifi;
        var html_data = "";
        $("#table_wifi_users #nb_wifi_users").html(wifi_stations.Count);
        for (elm_wifi in wifi_stations) {
            var elm_dhcp = null;
            var station_html = "00:00:00:00:00:00";
            if (elm_wifi == "Count") continue;
            for (elm_dhcp in dhcp_stations) 
                if (dhcp_stations[elm_dhcp].MACAddress.toLowerCase() == wifi_stations[elm_wifi].MACAddress.toLowerCase())
                    break;
            var tt = parseInt(wifi_stations[elm_wifi].TimeInAssoc);
            var station = {
                Hostname:dhcp_stations[elm_dhcp].Hostname,
                MACAddress: wifi_stations[elm_wifi].MACAddress,
                IPAddress:dhcp_stations[elm_dhcp].IPAddress,
                TimeInAssoc: isNaN(tt) ? 'Desconhecido ' : parseInt(tt / 60) + " min",
            }
            var html_data = applyTemplate("#table_wifi_users .tpl", {}, station);
            $("#table_wifi_users tbody").append(html_data);
        }
        
    }   
   return {
    init: function(data) {
         
        pageData = data;
        initEthBinders();
        showLANEthernetInterface(pageData);
        initHPNABinders();
        showHPNA(pageData);
        initWifiBinders();
        showWifi(pageData);
        
        if (data.WANDeviceType.List != "") {
            if (data.wan_conn_type == "ATMEthernetInterface" || data.wan_conn_type == "PTMEthernetInterface") {
                initDSLBinders();
                showDSL(pageData);
            } else {
                initWANEthBinders(data);
            }
            
        }
    }
   };
})(lite, App);