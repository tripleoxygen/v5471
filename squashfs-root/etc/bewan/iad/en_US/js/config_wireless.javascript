var WirelessUtil = (function() {
    return {
        // from util.javascript
        numToHex: function(inNumeric) {
            if (inNumeric == 10) return "A";
            else if (inNumeric == 11) return "B";
            else if (inNumeric == 12) return "C";
            else if (inNumeric == 13) return "D";
            else if (inNumeric == 14) return "E";
            else if (inNumeric == 15) return "F";
            else return "" + inNumeric;
        },
        
        // from util.javascript
        hexa2Ascii: function(inHexa) {
            var inHexaLen = inHexa.length,
                tmpByte,
                outAscii = "",
                outAsciiLen;

            inHexa = inHexa.toUpperCase();
            if ((inHexaLen % 2) != 0) {
                throw ('The hexadecimal sequence is incomplete.');
            }
            for (var i = 0; i < inHexaLen; i++) {
                tmpByte = inHexa.charAt(i);
                if (((tmpByte < '0') || (tmpByte > '9')) && ((tmpByte < 'A') || (tmpByte > 'F'))) {
                    throw 'The hexadecimal sequence contains non-hex characters.';
                }
                if ((i % 2) == 0) outAscii += '%';
                outAscii += tmpByte;
            }
            outAscii = unescape(outAscii);
            outAsciiLen = outAscii.length;

            if (outAsciiLen != Math.floor(inHexaLen / 2)) {
                throw 'The hexadecimal sequence contains non-printing characters.';
            }
            for (i = 0; i < outAsciiLen; i++) {
                tmpByte = outAscii.charCodeAt(i);
                if ((tmpByte < 32) || (tmpByte > 127)) {
                    throw 'The hexadecimal sequence contains non-printing characters.';
                }
            }
            return outAscii;
        },

        // from util.javascript
        ascii2Hexa: function(inAscii) {
            var outHexa = '';
            var inAsciiLen = inAscii.length;
            var ascii;
            var highByte;
            var lowByte;

            for (var i = 0; i < inAsciiLen; i++) {
                ascii = inAscii.charCodeAt(i) % 256;
                highByte = Math.floor(ascii / 16);
                lowByte = ascii % 16;
                outHexa += this.numToHex(highByte) + this.numToHex(lowByte);
            }
            return outHexa;
        },
    
        // from util.javascript
        isAscii: function(Str,inCouldBeEmpty,inLength) {
            if (!Str) return inCouldBeEmpty;
            if (Str.length != inLength) return false;
            Str = Str.toUpperCase();
            return (/^[\w !~#\$%&'"\(\)\*+,\-\.\/\:;<=>\?@\[\]\\\^`\{\}\|]+$/).test(Str);
        },
        
        isHexadecimal: function(Str, inCouldBeEmpty, inLength) {
            if(!Str) {return inCouldBeEmpty;}
            if (Str.length != inLength) return false;
            Str = Str.toUpperCase();
            var regExp = new RegExp("^[0-9A-F]{" + inLength + "}$");
            return regExp.test(Str);
        }
        
    };
})();

var Page = (function($, App) {
    var data, util = $.util,
    vRules,
    token,
    cli,
    validator,
        
    Messages = App.MessageUtil,
    // ui elements
    primarySettingsUi,
    uiWifiInterfaces,
        
    // binders
    //primarySettingsBinder,
    wlanBasConfigBinder,
    wlanAdvConfigBinder,
        
    // changes to the ui are recorded here
    updatesBas = {},
    updatesAdv = {},
    globalUpdates = {},
    
    allMACFilters = {},
    
    currWlanId = 1;
    
    vRules = {
        "WLANInterface_1_Config_SSID": [
            {
                type: "required",
                message: 'Please provide a network name (SSID).'
            },
            {
                type: "pattern",
                pattern: /^[0-9A-Za-z%\(\?>@\)\^~"_=\+'&\.\]/\\| \*<!#\$\-\[\{\}:;,]+$/,
                message: 'Network name must be alpha numeric.'
            }
        ],
        "WLANInterface_1_Config_WPSPINCode": {
            type: "required",
            validateIf: function() {
                return ($("#WLANInterface_1_WPSEnable").get(0).checked && 
                        $("#WLANInterface_1_WPSMethod").val() === "PIN");
            },
            message: 'Please provide a PIN'
        },
        "wirelessPassword": {
            type: function(val, opts) {
                var pass = util.trim(val), sec = $("#WLANInterface_1_Config_BeaconType").val(), passLen = pass.length;
                // password is blank, not changin the password.
		if(!pass && sec != 'BasicNone') {
                    opts.message = 'Please provide a password';
                    return false;
                }
                
                // check for spaces
                if(pass.indexOf('\\s') != -1) {
                    opts.message = 'Password cannot contain white spaces.';
                }
                
                // check for 
                if(sec === "WPA" || sec === "WPA2" || sec === "WPA-Auto") {
                    if(! WirelessUtil.isHexadecimal(pass, false, 64)) {
                        if(passLen < 8 || passLen > 63 || !WirelessUtil.isAscii(pass, false, passLen)) {
                            opts.message = 'Password must be 64 hex digits or 8 to 63 ASCII characters';
                            return false;
                        }
                    }
                }
                
                // check for WEP
                if(sec === "Basic") {
                    if(! WirelessUtil.isHexadecimal(pass, false, 10) && !WirelessUtil.isHexadecimal(pass, false, 26)) {
                        if(pass.length !== 5 && pass.length !== 13) {
                            opts.message = 'Password must be 10 or 26 hex or 5 or 13 ASCII characters.';
                            return false;
                        }
                    }
                }
                return true;
            },
            message: 'Please provide a valid password.'
        }
    };    
    validator = $.validator({rules: vRules, renderer: App.ValidationMessageRenderer()});

    filteringRules = {
        filtering_Hostname: [
            {type: "required", message: 'Please provide a Hostname (alpha-numeric).'},
            {type: "pattern", pattern: /^[0-9A-Za-z_-]+$/, message: 'Network name must be alpha numeric.'}
        ],
        filtering_MACAddress: [
            {type: "required", message: 'Please provide a MAC Address.'},
            {
                type: "pattern", 
                pattern: /^[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}$/, 
                message: 'Please provide a valid MAC Address.'
            }
        ]
    };
    filteringValidator = $.validator({rules: filteringRules, renderer: App.ValidationMessageRenderer()});
    
    function handleWpsModeChange(val) {
        var pinCodeUi = $("#pinNumber"), pushButtonUi = $("#wpsPushButton");
        
        validator.clear();
        
        if(val === "PIN") {
            pinCodeUi.removeClass("none");
            pushButtonUi.addClass("none");
        }else {
            pushButtonUi.removeClass("none");
            pinCodeUi.addClass("none");
        }
    }
    
    function handleWpsEnabled(bVal) {
        var wpsSettingsUi = $("#wpsSettings1");
        var pinCodeUi = $("#pinNumber");
        if(bVal == 1) {
            wpsSettingsUi.removeClass("none");
            handleWpsModeChange($("#WLANInterface_1_WPSMethod").val());
        }else {
            wpsSettingsUi.addClass("none");
            pinCodeUi.addClass("none");
        }
    }

    function handleWmmEnabled(bVal) {
        var wmmpsSettingsUi = $("#WMMPSSettings");
        if(bVal == 1) {
            wmmpsSettingsUi.removeClass("none");
        }else {
            wmmpsSettingsUi.addClass("none");
            $("#WLANInterface_1_WMMPSEnable").attr("value", bVal);
            $("#WLANInterface_1_WMMPSEnable").setStyle({'backgroundPosition': '-34px'});
        }
    }

    function handleMacFiltering(bVal) {
        var macFSettingsUi = $("#MACFilteringSettings");
        var macFTableUi = $("#MACFilteringTable");

        if(bVal == 1) {
            macFSettingsUi.removeClass("none");
            macFTableUi.removeClass("none");
        }else {
            macFSettingsUi.addClass("none");
            macFTableUi.addClass("none");
        }
    }
    
    function writeWpsConfig(callback) {
        var method = $("#WLANInterface_1_WPSMethod").val();
        
        validator.clear();
        if(method === "PIN" && !validator.validate(["WLANInterface_1_Config_WPSPINCode"])) {
            return;
        }

        cli.rollback();
        cli.write("WLANInterface_" + currWlanId + "_WPSEnable", 1);
        cli.write("WLANInterface_" + currWlanId + "_WPSMethod", method);
        cli.commit(function(res) {
            if(res.error) {
                Messages.error(res.error);
            }else {
                if(callback) {
                    callback();
                }
            }
        });
    }
    
    function connectPin() {
        Messages.clearAll();
        var pin = util.trim($("#WLANInterface_1_Config_WPSPINCode").val());
        
        // validate if PIN was provided
        if(!validator.validate(["WLANInterface_1_Config_WPSPINCode"])) {
            return;
        }

        writeWpsConfig(function() {
            if(pin) {
                cli.rollback();
                cli.write("WLANInterface_" + currWlanId + "_Config_WPSPINCode", pin);
                cli.commit(showWpsSuccess);
            }
        });
    }

    function connectPushButton() {
        Messages.clearAll();
        writeWpsConfig(function() {
            cli.rollback();
            cli.fct("wifi_wps_push", "");
            cli.commit(showWpsSuccess);
        });
    }
    
    function showWpsSuccess(res) {
        if(res.error) {
            var method = $("#WLANInterface_1_WPSMethod").val();
            if(method === "PIN") {
                Messages.error('Invalid PIN. Please try again.');
            }else {
                Messages.error('Error initiating WPS connection.');
            }
        }else {
            Messages.info('WPS connection initiated');
        }
    }

    function handleWirlessSecurityChange(val) {
        var wirelessPassUi = primarySettingsUi.find(".wireless-pass");
        if(val === 'BasicNone') {
            wirelessPassUi.addClass("hidden");
        }else {
            wirelessPassUi.removeClass("hidden");
        }
    }
    
    function handleWirelessSecurityChange(field, changeKey) {
        var beaconKey = "WLANInterface_" + 1 + "_Config_BeaconType", 
            wepEnc = "WLANInterface_" + 1 + "_Config_WEPEncryption",
            wpaEnc = "WLANInterface_" + 1 + "_Config_WPAEncryption",

            beaconType = field.value;
            if (beaconType == 'Basic') {
                if (data.WLANInterface["1"]["Config"]["WEPKeyAscii1"] == '1') {
                    if (changeKey) $("#wirelessPassword").val(WirelessUtil.hexa2Ascii(data.WLANInterface["1"]["Config"]["WEPKey1"]));
                } else {
                    if (changeKey) $("#wirelessPassword").val(data.WLANInterface["1"]["Config"]["WEPKey1"]);
                }
            } else {
                if (changeKey) $("#wirelessPassword").val("");
            }
            var passwd = util.trim($("#wirelessPassword").val());
            
        if(beaconType === "BasicNone" || beaconType === "Basic") {
            // For 'Basic' and 'BasicNone' the beacon is always 'Basic'
            updatesBas[beaconKey] = "Basic";
            updatesBas[wepEnc] = (beaconType === "BasicNone") ? "None" : "WEP-AUTO";
        }else {
            updatesBas[beaconKey] = beaconType;
            updatesBas[wpaEnc] = "Auto";
        }
        if (changeKey) configureWirelessPassword(beaconType, passwd);
    }
    
    function configureWirelessPassword(beacon, passwd) {
        var asciiBit = 0, 
            encPass = ConfigAccess.encrypt(data.token, passwd),
            wepKeyProp = "WLANInterface_" + currWlanId + "_Config_WEPKey1", 
            wepAsciiProp = 'WLANInterface_' + currWlanId + '_Config_WEPKeyAscii1',
            wpaDefKeyProp = "WLANInterface_" + currWlanId + "_Config_WPADefaultKey";
            
        // unset any values previously set in the update data.
        delete updatesBas[wepKeyProp];
        delete updatesBas[wepAsciiProp];
        delete updatesBas[wpaDefKeyProp];
        
        // security is none, Ignore password
        if(beacon === "BasicNone" || !passwd) {
            return;
        }
        
        if(beacon === "Basic") { // WEP
            if(WirelessUtil.isAscii(passwd, false, 5) || WirelessUtil.isAscii(passwd, false, 13) ) {
                passwd = ConfigAccess.encrypt(data.token,WirelessUtil.ascii2Hexa(passwd));
                asciiBit = 1;
            }
            
            if( WirelessUtil.isHexadecimal(passwd, false, 10) || WirelessUtil.isHexadecimal(passwd, false, 26)) {
                passwd = ConfigAccess.encrypt(data.token,passwd);
                asciiBit = 0;
            }

            if(encPass) {
                updatesBas[wepKeyProp] = passwd;
            }
            updatesBas[wepAsciiProp] = asciiBit;
        }else { // WPA variants
            if(encPass) {
                updatesBas[wpaDefKeyProp] = encPass;
            }
        }
        
        // console.log(JSON.stringify(updates, null, " "));
    }
    
    function checkBoxFormatter(val, ctx) {
        var fld = ctx.field.get(0);
        if(ctx.operation === "read") {
            return fld.checked ? 1 : 0;
        }else {
            fld.checked = (val == "1");
            return null;
        }
    }
    
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

    function switchSSIDBrdFormatter(val, ctx) {
        var fld = ctx.field;
        if(ctx.operation === "read") {
            var res = fld.attr("state");
            if (res == "1") return 0;
            else return 1;  
        }else {
            fld.attr("state", val);
            if (val == "1" ) {
                fld.setStyle({'backgroundPosition': '-34px'});
            } else {
                fld.setStyle({'backgroundPosition': '0px'});
            }
            return null;
        }
    }

    function ssidFormatter(val, ctx) {
        var fld = ctx.field;
        return (ctx.operation === "read") ? ctx.field.attr("value") : val;
    }    

    function setupBinders() {
        wlanBasConfigBinder = App.DataBinder({
            fields: [
                "WLANConfig_Enable",
                "WLANInterface_1_Config_HideSSID",
                "WLANInterface_1_Config_SSID",
                "WLANInterface_1_Config_BeaconType",
                "WLANInterface_1_WPSEnable",
            ],
            formatters: {
                "WLANInterface_1_Config_SSID":ssidFormatter,
                "WLANConfig_Enable": switchFormatter,
                "WLANInterface_1_Config_HideSSID": switchSSIDBrdFormatter,
                "WLANInterface_1_Config_BeaconType": function(val, ctx) {
                    var isWrite = ctx.operation === "write", 
                    wlanid = 1;//ctx.indices.wlanid, 
                    data = ctx.data, 
                    wlanIfConfig = data.WLANInterface[""+ wlanid].Config;

                    if(isWrite) {
                        if(val === "Basic") {
                            if(wlanIfConfig.WEPEncryption === "None") {
                                return "BasicNone";
                            }
                            if (data.WLANInterface["1"]["Config"]["WEPKeyAscii1"] == '1') {
                                $("#wirelessPassword").val(WirelessUtil.hexa2Ascii(data.WLANInterface["1"]["Config"]["WEPKey1"]));
                            } else {
                                $("#wirelessPassword").val(data.WLANInterface["1"]["Config"]["WEPKey1"]);
                            }
                            return "Basic";
                        }else {
                            $("#wirelessPassword").val(data.WLANInterface["1"]["Config"]["WPADefaultKey"]);
                            return val;
                        }
                    }
                    return null;
                },
                "WLANInterface_1_WPSEnable": function(val, ctx) {
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
                        handleWpsEnabled(val);
                        return null;
                    }
                }
            }, 
            onfieldchange: function(field, binder) {
                if(field.className != "switchButton") {
                     var fId = field.id;
                     if(fId === "WLANInterface_1_Config_BeaconType") {
                         handleWirelessSecurityChange(field, true);
                     }else {
                         binder.serialize({
                             target: updatesBas,
                             indices: {
                                 wlanid: currWlanId
                             }
                         }, fId);
                     }
                }
            }
        });

        wlanAdvConfigBinder = App.DataBinder({
            fields: [
                "WLANConfig_Standard",
                "WLANConfig_Channel",
                "WLANConfig_Bandwidth",
                "WLANConfig_TxPower",
                "WLANInterface_1_WMMEnable",
                "WLANInterface_1_WMMPSEnable",
                "WLANInterface_1_MACAddress",
                "WLANInterface_1_ACLEnable",
            ],
            formatters: {
                "WLANInterface_1_WMMPSEnable": switchFormatter,
                "WLANInterface_1_WMMEnable": function(val, ctx) {
                    var fld = ctx.field;
                    if(ctx.operation === "read") {
                        return fld.attr("state");
                    }else {
                        fld.attr("state", val);
                        if (val == "0" ) {
                            fld.setStyle({'backgroundPosition': '-34px'});
                        }else {
                            fld.setStyle({'backgroundPosition': '0px'});
                        }
                        
                        handleWmmEnabled(val);
                        return null;
                    }
                },
                "WLANInterface_1_ACLEnable": function(val, ctx) {
                    var fld = ctx.field;
                    if(ctx.operation === "read") {
                        return fld.attr("state");
                    }else {
                        fld.attr("state", val);
                        if (val == "0" ) {
                            fld.setStyle({'backgroundPosition': '-34px'});
                        }else {
                            fld.setStyle({'backgroundPosition': '0px'});
                        }
                        
                        handleMacFiltering(val);
                        return null;
                    }
                }
            }, 
            onfieldchange: function(field, binder) {
                if(field.className != "switchButton") {
                    var fId = field.id;
                    binder.serialize({
                        target: updatesAdv,
                        indices: {
                            wlanid: currWlanId
                        }
                    }, fId);
                }
            }
        });
    }
    
    function updateWLanIfData(wlanid) {
        var key = "WLANInterface_" + wlanid;
        cli.rollback().read(key)
            .commit(function(res) {
                if(res.error) {
                    Messages.error('Error getting wireless data. Please refresh the page.');
                }else {
                    data.WLANInterface["" + wlanid] = res[key];
                    populateBasForm();
                    populateAdvForm();
                    Messages.info('Wireless configuration successfully saved.');
                }
            });
    }
    
    function updateGlobalData() {
        cli.rollback().read("WLANConfig").commit(function(res) {
            if(res.error) {
                Messages.error('Error getting wireless data. Please refresh the page.');
            }else {
                data.WLANConfig = res.WLANConfig;
                populateAdvForm();
                populateBasForm();
                Messages.info('Wireless configuration successfully saved.');
            }
        });
    }
    
    function populateBasForm() {
        $("#WLANInterface_1_Config_BeaconType").html('');
        var standard = data.WLANConfig.Standard;
        if( standard == "11n" || standard == "11gn" || standard == "11bgn") {
            $("#WLANInterface_1_Config_BeaconType").append(['<option value="WPA-Auto">WPA/WPA2</option>',
                                                            '<option value="WPA2">WPA2</option>',
                                                            '<option value="BasicNone">None (Not Recommended)</option>']);
        }
        else {
            $("#WLANInterface_1_Config_BeaconType").append(['<option value="WPA-Auto">WPA/WPA2</option>',
                                                          '<option value="WPA2">WPA2</option>',
                                                          '<option value="WPA">WPA</option>',
                                                          '<option value="Basic">WEP</option>',
                                                          '<option value="BasicNone">None (Not Recommended)</option>']); 
        }
        wlanBasConfigBinder.write({
            data: data
        });
    }

    function populateAdvForm() {
        wlanAdvConfigBinder.write({
            data: data
        });
    }
    
    function hasModifications(updateData) {
        var has = false, key;
        for(key in updateData) {
            has = true;
            break;
        }
        return has;
    }
    
    
    function initWifiInterfaceListUi() {
        var wlans = data.WLANInterface, wlanCount = Number(wlans.Count), wlanList = [], i;
        
        for(i = 1; i <= wlanCount; i++) {
            var theWlan = wlans[i + ""];
            wlanList[wlanList.length] = {
                wlanid: i,
                name: theWlan.Description || theWlan.Name
            };
        }
    }
    
    function addMacFiltering(hostname,macaddress) {
        var index = 1;
        var lastindex=0;
        var ACLs =data.AccessControl;
        var aclList = ACLs.List.split(',');
        aclList.sort();
        for (var i in allMACFilters) {
            if (allMACFilters[i] == macaddress) {
                return 0;
            }
        }
        for (var i in allMACFilters) {
            if (parseInt(i) - parseInt(lastindex) > 1) {
                index = parseInt(lastindex) +1;
                break;
            }
            index = parseInt(i)+1;
            var existing = true;
            for (var j in allMACFilters) {
                if ( j == index){
                    existing = false;
                    break;
                }
            }
            if (existing) break;
            lastindex = i;
        }
        cli.rollback();
        cli.write("LANDevice_1_AccessControl_"+index+"_ClientName",hostname);
        cli.write("LANDevice_1_AccessControl_"+index+"_MACAddress",macaddress);
        cli.write("LANDevice_1_AccessControl_"+index+"_Enable",1);
        cli.commit(function(res) {
            if(!res.error) {
                allMACFilters[index] = macaddress;
            }
        });

        return index;
    }

    function displayMACFiltering(){
        allMACFilters = {};
        var uifilteringTable= $("#MACFilteringTableBody");
        var ACLs =data.AccessControl;
        var aclList = ACLs.List.split(',');
        aclList.sort();
        var tableBody='';

        if (ACLs.List != '') {
            for (var i in aclList) {
                allMACFilters[aclList[i]] = ACLs[aclList[i]]["MACAddress"];
                if (ACLs[aclList[i]]["Enable"] == 1) {
                    var mac = ACLs[aclList[i]]["MACAddress"];
                    tableBody +='<tr id="MACRow'+aclList[i]+'"><td>'+ACLs[aclList[i]]["ClientName"]+'</td><td>'+mac+'</td><td class="actions"><img width="16px" onclick="Page.remove(\''+mac+'\');" alt="Delete" src="../../img/delete.png"></td></tr>';
                }
            }
        }
        uifilteringTable.html(tableBody);
    }

    function removeMACFiltering(mac){
        Messages.clearAll();
        var index;
        var ACLs =data.AccessControl;
        var aclList = ACLs.List.split(',');
        for (var i in allMACFilters) {
            if (allMACFilters[i] == mac) {
                index= i;
                break;
            }
        }
        
        cli.rollback();
        cli.remove(["LANDevice_1_AccessControl", index].join("_"));
        cli.commit(function(res) {
            if(!res.error) {
                Messages.info('MAC Filtering entry successfully removed.');
                
            }
        });
        $("#MACRow"+index).addClass("none");
    }

    function populateMACFiltering() {
        var uifilteringMACAddresss = $("#filtering_MACAddress"), uifilteringHostname = $("#filtering_Hostname"), uifilteringTable= $("#MACFilteringTableBody");
        
        displayMACFiltering();

        $("#cancelFiltering").bind("click", function() {
            filteringValidator.clear();
            Messages.clearAll();
            uifilteringHostname.val('');
            uifilteringMACAddresss.val('');
        });

        $("#addFiltering").bind("click", function() {
            var datas;
            filteringValidator.clear();
            Messages.clearAll();
            if(filteringValidator.validate()) {
                datas = {
                    MACAddress: util.trim(uifilteringMACAddresss.val()),
                    Hostname: util.trim(uifilteringHostname.val()),
                    User: 1
                };
                var index;
                if (index = addMacFiltering(datas["Hostname"],datas["MACAddress"]) > 0) {
                    Messages.info('MAC Filtering entry successfully added.');
                    var mac = uifilteringMACAddresss.val();
                    uifilteringTable.append('<tr id="MACRow'+index+'"><td>'+uifilteringHostname.val()+'</td><td>'+mac+'</td><td class="actions"><img width="16px" onclick="Page.remove(\''+mac+'\');" alt="Delete" src="../../img/delete.png"></td></tr>');
                    uifilteringHostname.val('');
                    uifilteringMACAddresss.val('');
                } else {
                    Messages.error('This MAC Address already exists.');
                }
            }
        });
    }

    function setupUi() {
            
        if(data.wirelessNMode == 1) {
            $("#WLANConfig_Standard")
            .append([
                '<option value="11n">802.11n</option>',
                '<option value="11gn">802.11g+n</option>',
                '<option value="11bgn">802.11b+g+n</option>'
             ].join(""));
        }

        initWifiInterfaceListUi();
        
        $(".switchButton").bind("click", function() {
            var id = $("#"+this.id);
            if(this.id == "WLANInterface_1_Config_HideSSID" && id.attr("state") ==  1) {
                if (! confirm('This will also disable wps feature, do you want to continue ?')) { 
                    return;
                } else {
                    if ($("#WLANInterface_1_WPSEnable").attr("state") == 1 ) {
                        morpheus($("#WLANInterface_1_WPSEnable").elements[0], { duration:300, backgroundPosition: '-34px'});
                        $("#WLANInterface_1_WPSEnable").attr("state", 0);
                        handleWpsEnabled(0);
                    }
                }
            }
            if (id.attr("state") == 0 ) {
                morpheus(id.elements[0], { duration:300, backgroundPosition: '0px'});
                id.attr("state", 1);
            } else {
                morpheus(id.elements[0], { duration:300, backgroundPosition: '-34px'});
                id.attr("state", 0);
            }
            if(this.id == "WLANInterface_1_WPSEnable") {
                var id = $("#"+this.id);
                handleWpsEnabled(id.attr("state"));
            }
            else if(this.id == "WLANInterface_1_WMMEnable") {
                var id = $("#"+this.id);
                handleWmmEnabled(id.attr("state"));
            }
            else if(this.id == "WLANInterface_1_ACLEnable") {
                var id = $("#"+this.id);
                handleMacFiltering(id.attr("state"));
            }

            wlanBasConfigBinder.serialize({
                target: updatesBas,
                indices: {
                    wlanid: currWlanId
                }
            }, this.id);
            wlanAdvConfigBinder.serialize({
                target: updatesAdv,
                indices: {
                    wlanid: currWlanId
                }
            }, this.id);

        });

        $("#wirelessSecurity").bind("change", function() {
            handleWirlessSecurityChange(this.value, currWlanId);
        });
        
        $("#WLANInterface_1_WPSMethod").bind("change", function() {
            handleWpsModeChange(this.value);
        });
        
        util.forEach($("#WLANInterface_1_WPSMethod option").elements, function (opts) {
	    if (opts.value == data.WLANInterface["1"].WPSMethod) {
	      opts.selected=true;
	    }
         });

        $("#wpsPushButton").bind("click", function() {
            connectPushButton();
        });
        
        $("#wpsPinConnect").bind("click", function() {
            connectPin();
        });
        
        $("#wirelessPassword").bind("change", function() {
            configureWirelessPassword($("#WLANInterface_1_Config_BeaconType").val(), util.trim(this.value));
        });
        
        $("#WLANConfig_Standard").bind("change", function() {
            var beaconField = document.getElementById('WLANInterface_1_Config_BeaconType');
            var beaconValue = beaconField.value;
             $("#WLANInterface_1_Config_BeaconType").html('');
             if( $("#WLANConfig_Standard").val() == "11n" || $("#WLANConfig_Standard").val() == "11gn" || $("#WLANConfig_Standard").val() == "11bgn") {
                 $("#WLANInterface_1_Config_BeaconType").append([
                                                                '<option value="WPA-Auto">WPA/WPA2</option>',
                                                                '<option value="WPA2">WPA2</option>',
                                                                '<option value="BasicNone">None (Not Recommended)</option>']);
                if ( beaconValue != "WPA" && beaconValue != "Basic") {
                    $("#WLANInterface_1_Config_BeaconType").val(beaconValue);
                } else {
                    $("#WLANInterface_1_Config_BeaconType").val("BasicNone");
                }
             }  
             else {
                 $("#WLANInterface_1_Config_BeaconType").append(['<option value="WPA-Auto">WPA/WPA2</option><option value="WPA2">WPA2</option>',
                                                               '<option value="WPA">WPA</option>',
                                                               '<option value="Basic">WEP</option>',
                                                               '<option value="BasicNone">None (Not Recommended)</option>']); 
                $("#WLANInterface_1_Config_BeaconType").val(beaconValue);
             }

            handleWirelessSecurityChange(beaconField,false);
        });
        
        $("#saveBas").bind("click", function() {
            Messages.clearAll();
            if(validator.validate()) { // only validate SSID and password
		var method = $("#WLANInterface_1_WPSMethod").val();
		cli.rollback().write(updatesBas).write("WLANInterface_" + currWlanId + "_WPSMethod", method).commit(function(res) {
                    if(cli.error) {
                        Messages.error(res.error);
                    }else {
                        updatesBas = {};
                        Messages.info('Wireless basic configuration successfully saved.');
                        //updateWLanIfData(currWlanId);
                    }
                });
            }
        });
        
        $("#saveAdv").bind("click", function() {
            Messages.clearAll();
            cli.rollback().write(updatesAdv).commit(function(res) {
                if(cli.error) {
                    Messages.error(res.error);
                }else {
                    updatesAdv = {};
                    Messages.info('Wireless advanced configuration successfully saved.');
                    //updateWLanIfData(currWlanId);
                }
            });
        });
        
        $("#cancelBas").bind("click", function() {
            updatesBas = {};
            populateBasForm();
        });
        $("#cancelAdv").bind("click", function() {
            updatesAdv = {};
            populateAdvForm();
        });

    }

    function initUI() {
        setupUi();
        setupBinders();
	populateBasForm();
	populateAdvForm();
        populateMACFiltering();
    }

    return {
        init: function(pageData) {
            data = pageData;
            token = data.token;
            cli = ConfigAccess(token);
            initUI();
        },
        remove: function(mac){
            removeMACFiltering(mac);
        }
    };
})(lite, App);
