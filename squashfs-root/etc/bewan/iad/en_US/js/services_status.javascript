var Page = (function($, App) {
    var util = $.util, data;
    var cnx_type = { xDSL: "xDSL", "eth" : "WANEthernetInterface"};
    
    function showLansStatus() {
        var portIdx = data.switches.List.split(",");
        for ( var i in portIdx) {
            if (data.switches[portIdx[i]] != undefined && data.switches[portIdx[i]].Status.LinkState == "Up" ) {
                $("#LAN"+data.switches[portIdx[i]].PortId+"Status").removeClass("off").removeClass("red").addClass("on");
                for (var j = 1; j <= data.lanDevices.Count; j++){
                    if (data.lanDevices[j].MACAddress == data.switches[portIdx[i]].Status.ARPTable) {
                        $("#LAN"+data.switches[portIdx[i]].PortId+"Hostname").html(data.lanDevices[j].Hostname != '' ? data.lanDevices[j].Hostname : '---' );
                        break;
                    }
                }
            }
        }
        var html = "";
        for (var j = 1; j <= data.lanDevices.Count; j++){
            if (data.lanDevices[j].InterfaceType == "Ethernet") {
                html += 'Hostname: '+data.lanDevices[j].Hostname+'\n';
                html += 'MAC: '+data.lanDevices[j].MACAddress+'\n';
                html += 'IP: '+data.lanDevices[j].IPAddress+'\n';
                html += data.lanDevices[j].AddressingType+'\n';
                html +='\n';
            }
        }
        if (html == "") {
            html = 'Not connected';
        }
        $("#lanStation").html(html);
    }

    function showSTBStatus() {
        STBDetail = $("#STBDetails");
        if (data.ledTvState.List != undefined && data.ledTvState.List != "") {
            var idx = data.ledTvState.List;
            if (data.ledTvState[idx].State == "On") {
                STBDetail.removeClass("off").addClass("on");
                STBDetail.removeClass("red");
                STBDetail.find("span.state").html('Available');
                } 
            }
        var vodWCD = data.vodWanConnectionDevice[data.vodWanConnectionDevice.List];
        var html = "";
        var stbcount = 0;
        for (var j = 1; j <= data.lanDevices.Count; j++){
            if ( isStb(data.lanDevices[j].UserClass) ) {
                stbcount ++;
                html += 'Hostname: '+data.lanDevices[j].Hostname+'\n';
                html += 'MAC: '+data.lanDevices[j].MACAddress+'\n';
                html += 'IP: '+data.lanDevices[j].IPAddress+'\n';
                html += 'DNS:'+vodWCD.Status.DNSServers+'\n';
                html +='\n'
            }
        }
        if (html == "") {
            html = 'Not Available';
        }
        
        $("#VODIP").html(vodWCD.Status.IPAddress);
        $("#stbCount").html(stbcount);
        $("#hpna").html(data.hpna == 1 ? 'Enabled' : 'Disabled' );
        $("#stbStation").html(html);
    }

    function showPhoneStatus() {
        var voiceLine = data.voiceProfile[data.voiceProfile.List].Line;
        var voipWCD = data.voipWanConnectionDevice[data.voipWanConnectionDevice.List];
        if (voipWCD.Status.State === "Up") {
            $("#VoiceStatus").removeClass("off").addClass("on");
            $("#VoiceStatus").removeClass("red");
            $("#Voice_Enable").html('Available');
        }

        var lineList = voiceLine.List.split(',');
         util.forEach(lineList, function(line) {
            if (voiceLine[line].Status == "Up") {
                $('#Line'+line+'Status').removeClass("off").addClass("on");
                $('#Line'+line+'Status').removeClass("red");
                $('#Line'+line+'Num').html(voiceLine[line].SIP.AuthUserName);
            }
        });
    }

    function isStb(userClass) {
        var ret = false;
        for (i in data.lanConfig.DHCPMatch) {
            if(data.lanConfig.DHCPMatch[i].SetMatchName == "stb-user") {
                if (data.lanConfig.DHCPMatch[i].UserClass == userClass) {
                    ret = true;
                    break;
                }
            }
        }
        return ret;
    }

    function showWirelessStatus() {

        var wLanIntfIdx = 1, wirelessDetails = $("#wirelessDetails"), wlEnable, wLanIntf;
               
        wLanIntf = data.activeWLANInterface[wLanIntfIdx];
        var wlanConf = data.WLANConfig;
        wlEnable = (wlanConf.Enable == 1);
        if(wlEnable) {
            wirelessDetails.removeClass("off").addClass("on");
            $("#ssid").html(wLanIntf.Config.SSID);
            switch (wLanIntf.Config.BeaconType) {
                case "WPA-Auto" :  $("#beaconType").html('WPA/WPA2');
                break;
                case "Basic":
                $("#beaconType").html((wLanIntf.Config.WEPEncryption) == "None" ? 'None' : 'WEP');
                break;
                default :  $("#beaconType").html(wLanIntf.Config.BeaconType);
                break;
            }
            if (wLanIntf.WPSEnable == 1) {
                $("#WPSEnable").html('On');
            } else {
                $("#WPSEnable").html('Off');
            }
            if (wLanIntf.Config.HideSSID == 1) {
                $("#HideSSID").html('No');
            } else {
                $("#HideSSID").html('Yes');
                $("#wirelessVisibility").html('Visible');
            }
            if (wlanConf.Channel == 0) {
                $("#Channel").html('Auto');
            } else {
                $("#Channel").html(wlanConf.Channel);
            }
            if (wLanIntf.Station.Count >0 ) {
                $("#wifiStation").html(wLanIntf.Station.Count +' wifi(s) station(s) connected:\n');
            }
            for (var i =1; i <= wLanIntf.Station.Count; i++){
                for (var j = 1; j <= data.lanDevices.Count; j++){
                    if (data.lanDevices[j].MACAddress == wLanIntf.Station[i].MACAddress) {
                        $("#wifiStation").append('- '+data.lanDevices[j].Hostname+' ('+wLanIntf.Station[i].MACAddress+')\n');
                    }
                }
            }
        } else {
            $("#wirelessSSID").addClass("none");
            $("#wirelessVisibility").addClass("none");
        }
    }

    function showHotSpotStatus() {
        var wLanIntfIdx = 2, HSDetails = $("#HSDetails"), wlEnable, wLanIntf;
               
        wLanIntf = data.activeWLANInterface[wLanIntfIdx];
        wlEnable = (wLanIntf.Enable == 1);
        if(wlEnable) {
            HSDetails.removeClass("off").addClass("on");
            $("#HSssid").html(wLanIntf.Config.SSID);
            $("#HSstate").html('Enable');
        } else {
            $("#HSSSID").addClass("none");
        }
    }
    
    /* check eth cnx */
    function get_wan_eth_cnx_status(wan_idx) {
        var status = "";
        util.forEach(data.Swicth, function (sw_id, sw) {
            if (sw_id == "Count") return;
            util.forEach(sw[sw_id].Port, function (port_id, port) {
                if (port_id == "List") return;
                if (port.WANEthernetInterfaceIdx != wan_idx) return;
                status = port.LinkState;
                return {};
            });
            if (status != "") return {};
        });
        return status;
    }
    
    /* Try to determine what cnx is used */
    function get_wan_cnx() {
        if (data.WANEthernetInterface.Enable == "1" || data.WANDSLInterfaceConfig.Enable == "0") return cnx_type.eth;
        /* here we are in Auto Mode, so we have to check link state to know what wan mode we will be used */
        var wan_idx = data.activeWanConnectionDevice.List.split(",")[0];
        if (data.WANEthernetInterface[wan_idx].LinkState.State == "Up") return cnx_type.eth;
        if (data.WANDSLLinkStatus.State != "Idle") return cnx_type.xDSL;
        return get_wan_eth_cnx_status(wan_idx) == "Down" ? cnx_type.xDSL : cnx_type.eth;
    }
    
    function showInternetStatus() {
        var activeWanDeviceList = data.activeWanConnectionDevice.List.split(","),
            activeWanIdx = activeWanDeviceList[0],
            activeWanDevice = data.activeWanConnectionDevice[activeWanIdx],
            activeWanIp = activeWanDevice.Status.IPAddress || activeWanDevice.Status.IP6Address,
            netInfo = {
                ipAddress: activeWanIp,
                wanDevice: activeWanDevice,
                wan_cnx_type: get_wan_cnx(),
            },
            dslDetails = $("#dslDetails"),
            ethDetails = $("#ethDetails"),
            pppDetails = $("#pppDetails"),
            downStream = $("#WANDSLLinkStatus_DownBitrates_Actual"),
            upStream = $("#WANDSLLinkStatus_UpBitrates_Actual"),
            synchro= $("#synchro"),
            session= $("#session"),
            modulation=$("#modulation"),
            localIP = $("#localIP"),
            publicIP=$("#publicIP"),
            remoteIP=$("#remoteIP"),
            primaryDNS=$("#primaryDNS"),
            secondaryDNS=$("#secondaryDNS");
        
        downStream.html(data.WANDSLLinkStatus.DownBitrates.Actual);
        upStream.html(data.WANDSLLinkStatus.UpBitrates.Actual);
        synchro.html(convertTime(data.WANDSLLinkStatus.Info.TimeConnected));
        session.html(convertTime(activeWanDevice.Status.UpTime));
        modulation.html(data.WANDSLLinkStatus.Info.Modulation+' ('+data.WANDSLLinkStatus.Info.ModulationType+')');
        localIP.html(data.localIP);
        publicIP.html(activeWanIp);
        remoteIP.html(activeWanDevice.Status.Remote);
        primaryDNS.html(activeWanDevice.Status.DNSServers.split(',')[0]);
        secondaryDNS.html(activeWanDevice.Status.DNSServers.split(',')[1]);
        
        switch(netInfo.wan_cnx_type) {
            case cnx_type.xDSL:
                netInfo.linkUp = data.WANDSLLinkStatus.State == 'Connected';
                ethDetails.css("display", "none");
                if(netInfo.linkUp) {
                    dslDetails.removeClass("off").addClass("on");
                    dslDetails.find("span.state").html('Synchronized')
                }
                break;
            case cnx_type.eth:
                netInfo.linkUp = (data.WANEthernetInterface[activeWanIdx].LinkState === "Up");
                dslDetails.css("display", "none");
                if(netInfo.linkUp) {
                    ethDetails.removeClass("off").addClass("on");
                    ethDetails.find("span.state").html('Up');
                }
                break;
            default:
                break;
        }
        if (netInfo.linkUp && activeWanDevice.Status.State === "Up") {
            pppDetails.removeClass("off").addClass("on");
            pppDetails.find("span.state").html('Up');
        }
    }
    
    function getEnabledPhysicalInterface(wanConnectionDevice) {
        var pIf, pIfList, ret;
       
        pIf = wanConnectionDevice.PhysicalInterface;
        pIfList = pIf.List.split(",");
      
        util.forEach(pIfList, function(pidx) {
            var p = pIf[pidx];
            if(p.Enable == 1) {
                ret = {
                    id: pidx,
                    pIf: p
                };
                return util.Break;
            }
            return null;
        });
        return ret;
    }
    
    function convertTime(val){
        var res='';
        var tab = [86400,3600,60];
        var remainder = val;
        var div;
        
        for (var i in tab) {
            div = parseInt(remainder / tab[i]);
            remainder =  remainder % tab[i];
            res+= div+':';
        }
        res+=remainder;
        return res;
    }

    function initUI() {
        showInternetStatus();
        showWirelessStatus();
        showHotSpotStatus();
        showLansStatus();
        showSTBStatus();
        showPhoneStatus();

        $(".status-link a").bind("click", function() {
            if ( $("#"+$(this).attr('id')+"-more").getStyle("display") == 'none' ) {
                $("#"+$(this).attr('id')+"-more").css("display", "table-row");
                $("#"+$(this).attr('id')).html('<u>Hide</u>');
            } else {
                $("#"+$(this).attr('id')+"-more").css("display", "none");
                $("#"+$(this).attr('id')).html('<u>More details</u>');
            }
        });
        
    }
    
    return {
        init: function(pageData) {
            data = pageData;
            
            initUI();
        }
    };
})(lite, App);
