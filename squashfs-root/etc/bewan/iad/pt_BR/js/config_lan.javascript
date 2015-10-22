var Page = (function($, App) {
    var data, cli, lanTabUi, 
    
    tabIndex = 0,
    tabs = ["dhcp", "portforwarding", "dmz", "upnp", "dyndns"];

    function initUI() {
        $(".switchButton").bind("click", function() {
            var id = $("#"+this.id);

            if(this.id != "Services_DynDNS_1_Enable"){
                if (id.attr("state") == 0 ) {
                    morpheus(id.elements[0], { duration:300, backgroundPosition: '0px'});
                    id.attr("state", 1);
                } else {
                    morpheus(id.elements[0], { duration:300, backgroundPosition: '-34px'});
                    id.attr("state", 0);
                }
            }
        });

        DhcpView.init(data);
        PortForwardingView.init(data);
        DmzView.init(data);
        UpnpView.init(data);
        DynDnsView.init(data);
    }
    
    return {
        init: function(pageData) {
            data = pageData;
            // tabIndex = // get it from the addressBar
            initUI();
        }
    };
})(lite, App);





/* --------------------------------------------- Router and DHCP Config Tab ----------------------------------------- */
var DhcpView = (function($, App) {
    var util = $.util, forEach = util.forEach,
        data, cli,    
        Messages = App.MessageUtil,
        
        reservationService,
        reservationTable,
        editorInputTemplate = $.template('<input type="{type}" class="{clazz}" id="{id}" value="{value}"></input>'),

        lanBinder,
        currLanId = "1",
        updates = {},

        reservationRules = {
            reservation_Hostname: [
                {type: "required", message: 'Por favor, informe um nome de dispositivo (alfanumérico).'},
                {type: "pattern", pattern: /^[0-9A-Za-z_-]+$/, message: 'O nome de rede precisa ser alfanumérico.'}
            ],
            reservation_MACAddress: [
                {type: "required", message: 'Por favor, informe um endereço de MAC.'},
                {
                    type: "pattern", 
                    pattern: /^[0-9A-Fa-f]{1,2}:[0-9A-Fa-f]{1,2}:[0-9A-Fa-f]{1,2}:[0-9A-Fa-f]{1,2}:[0-9A-Fa-f]{1,2}:[0-9A-Fa-f]{1,2}$/, 
                    message: 'Por favor, informe um endereço de MAC válido.'
                }
            ],
            reservation_IPAddress: [
                {type: "required", message: 'Por favor, informe um endereço de IP.'},
                {type: "ipAddress", message: 'Por favor, informe um endereço de IP válido.'}
            ]
        },
        reservationValidator = $.validator({rules: reservationRules, renderer: App.ValidationMessageRenderer()}),

        dhcpLanValidator = $.validator({
            rules: {
                "LANDevice_-lanid-_IPInterface_1_IPAddress": [
                    {type: "required", message: 'Por favor, informe um endereço de IP.'},
                    {type: "ipAddress", message: 'Por favor, informe um endereço de IP válido.'}
                ],

                "LANDevice_-lanid-_IPInterface_1_SubnetMask": [
                    {type: "required", message: 'Por favor, informe uma máscara de rede.'},
                    {type: "ipAddress", message: 'Por favor, informe uma máscara de rede válida.'}
                ],

                "LANDevice_-lanid-_HostConfig_MinAddress": [
                    {type: "required", message: 'Por favor, informe um endereço de IP.'},
                    {type: "ipAddress", message: 'Por favor, informe um endereço de IP válido.'}
                ],


                "LANDevice_-lanid-_HostConfig_MaxAddress": [
                    {type: "required", message: 'Por favor, informe um endereço de IP.'},
                    {type: "ipAddress", message: 'Por favor, informe um endereço de IP válido.'}
                ],

                "LANDevice_-lanid-_HostConfig_DHCPLeaseTime": [
                    {type: "required", message: 'Por favor informe o tempo de concessão em segundos.'},
                    {type: "number", sec: 0, message: 'O Período de Concessão precisa ser um número positivo.'}
                ]
            }, 
            renderer: App.ValidationMessageRenderer()
        });
    
    function ipAdressFormatter(val, ctx) {
        var id = ctx.field.get(0).id;
        if(ctx.operation === "read") {
            $("#"+id).val();
        } else {
            var ipTab = val.split(".");
            $("#"+id).val(val);
            for (var i in ipTab) {
                $("#"+id+i).val(ipTab[i]);
            }
            return (typeof val === "undefined" || val === null) ? "" : val;
        }
    }
    function toggleDns(val) {
        var dpy_state = val == "0" ? "none" : "table-row";
       
       $("#tr_custom_dns_primary,#tr_custom_dns_secondary").css({"display": dpy_state});
       if (val == "0") {
            $("#LANDevice_-lanid-_HostConfig_DNSServers0_0,#LANDevice_-lanid-_HostConfig_DNSServers0_1,#LANDevice_-lanid-_HostConfig_DNSServers0_2,#LANDevice_-lanid-_HostConfig_DNSServers0_3," +
              "#LANDevice_-lanid-_HostConfig_DNSServers1_0,#LANDevice_-lanid-_HostConfig_DNSServers1_1,#LANDevice_-lanid-_HostConfig_DNSServers1_2,#LANDevice_-lanid-_HostConfig_DNSServers1_3").val("");
            $("#LANDevice_-lanid-_HostConfig_DNSServers").val("");
       }
       //saveDNSServers();
    }
    
    function initDns() {
        var specificDns = $("#LANDevice_-lanid-_HostConfig_DNSServers").val() != "" ? "1" : "0";
        $("#use_dns_server").attr("state", specificDns);
    }

    function dnsServersFormatter(val, ctx) {
        var id = ctx.field.get(0).id;
        if(ctx.operation === "read") {
            //var state = $("#"+id).attr("state") == "1" ? "0" : "1";
            //$("#"+id).attr("state", state);
            toggleDns($("#"+id).attr("state"));
        } else {
            $("#"+id).attr("value", val);
            $("#"+id).attr("state", val.length > 0 ? "1" : "0");
            var dnsServTab = val.split(",");
            for (var i in dnsServTab) {
                var dnsTab = dnsServTab[i].split(".");
                for (var j in dnsTab) {
                    $("#"+id+i+'_'+j).val(dnsTab[j]);
                }
                
            }
            if ($("#"+id).attr("state")== "0" ) {
                $("#" + id).setStyle({'backgroundPosition': '-34px'});
            } else {
                $("#" + id).setStyle({'backgroundPosition': '0px'});
            }
            toggleDns($("#"+id).attr("state"));
            
        }
    }
    
    function checkBoxFormatter(val, ctx) {
        var fld = ctx.field.get(0);
        if(ctx.operation === "read") {
            return fld.checked ? 1 : 0;
        }else {
            fld.checked = (val == 1);
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

    
    function switchDnsFormatter(val, ctx) {
        var fld = ctx.field;
        if(ctx.operation === "read") {
            return fld.attr("state");
        }else {
            onToggleDns();
            fld.attr("state", val);
            if (val == "0" ) {
                fld.setStyle({'backgroundPosition': '-34px'});
            } else {
                fld.setStyle({'backgroundPosition': '0px'});
            }
            return null;
        }
    }
    function initBinder() {
        lanBinder = App.DataBinder({
            fields: [
                "LANDevice_-lanid-_HostConfig_DHCPServerEnable",
                "LANDevice_-lanid-_IPInterface_1_IPAddress",
                "LANDevice_-lanid-_IPInterface_1_SubnetMask",
                "LANDevice_-lanid-_HostConfig_MinAddress",
                "LANDevice_-lanid-_HostConfig_MaxAddress",
                "LANDevice_-lanid-_HostConfig_DHCPLeaseTime",
                "LANDevice_-lanid-_HostConfig_DNSServers",
            ],
            formatters: {
                "LANDevice_-lanid-_HostConfig_DHCPServerEnable":switchFormatter,
                "LANDevice_-lanid-_IPInterface_1_IPAddress": ipAdressFormatter,
                "LANDevice_-lanid-_IPInterface_1_SubnetMask": ipAdressFormatter,
                "LANDevice_-lanid-_HostConfig_MinAddress": ipAdressFormatter,
                "LANDevice_-lanid-_HostConfig_MaxAddress": ipAdressFormatter,
                "LANDevice_-lanid-_HostConfig_DNSServers": dnsServersFormatter,
            },
            onfieldchange: function(field, binder) {
                binder.serialize({
                    target: updates,
                    indices: {
                        lanid: currLanId
                    }
                }, field.id);
                
                // console.log(JSON.stringify(updates, null, ' '));
            }
        });
        
        populateDhcpForm(data);
    }

    function saveIPAddress(id) {
        var val = id.substring(0, id.length-1);
        var ipTab= new Array(4);
        for (var i = 0 ; i < ipTab.length ; i ++ ) {
            ipTab[i] = $("#"+val+i).val();
        }
        $("#"+val).val(ipTab.join('.'));
        var realval = val.replace("-lanid-", currLanId);
        updates[realval] = ipTab.join('.');
    }

    function saveDNSServers() {
        var dnsTab= new Array(4);
        var id = 'LANDevice_-lanid-_HostConfig_DNSServers';
        var dns1 = '';
        var dns2 = '';
        var val ='';
        for (var i = 0 ; i < dnsTab.length ; i ++ ) {
            dnsTab[i] = $("#"+id+'0_'+i).val();
        }
        dns1+= dnsTab.join('.'); 
        if ( dns1 != '...') val += dns1;
        for (var i = 0 ; i < dnsTab.length ; i ++ ) {
            dnsTab[i] = $("#"+id+'1_'+i).val();
        }
        dns2+= dnsTab.join('.'); 
        if ( dns1 != '...' && dns2 != '...') val += ',';
        if ( dns2 != '...') val += dns2;
        
        $("#"+id).attr("value", val);
        var realval = id.replace("-lanid-", currLanId);
        updates[realval] = val;
    }
    
    function populateDhcpForm(lanData) {
        lanBinder.write({
            data: lanData,
            indices: {
                lanid: currLanId
            }
        });
    }

    function populateLeaseTable() {
        var hasLan = 0;
        util.forEach(data.lanHosts, function(host, idx) {
            if(idx === "Count") {
                return;
            }
            if (host.AddressingType == "DHCP") {
                hasLan = 1;
                $("#leaseBody").append('<tr><td class="center">'+host.Hostname+'</td><td class="center">'+host.MACAddress+'</td><td class="center">'+host.IPAddress+'</td><td class="center">'+host.LeaseRemaining+' s.</td></tr>');
            }
        });
        if (hasLan == 0) {
       $("#leaseBody").append('<tr><td colspan="4">Não há dispositivos conectados na LAN</td></tr>');
        }

    }

    function iptoint(ip) {
        var components = ip.split('.');
        return (parseInt(components[0])*256*256*256 + parseInt(components[1])*256*256 + parseInt(components[2])*256 + parseInt(components[3]));
    }

    function checkIPRange() {
        var lanIP = $("#LANDevice_-lanid-_IPInterface_1_IPAddress").val();
        var mask = $("#LANDevice_-lanid-_IPInterface_1_SubnetMask").val();
        var minRange =$("#LANDevice_-lanid-_HostConfig_MinAddress").val();
        var maxRange =$("#LANDevice_-lanid-_HostConfig_MaxAddress").val();

        return ((iptoint(lanIP) & iptoint(mask)) == (iptoint(minRange) & iptoint(mask)) &&  (iptoint(lanIP) & iptoint(mask)) == (iptoint(maxRange) & iptoint(mask)));
    }

    function checkMaxMinRange(){
        var minRange =$("#LANDevice_-lanid-_HostConfig_MinAddress").val();
        var maxRange =$("#LANDevice_-lanid-_HostConfig_MaxAddress").val();

        return iptoint(maxRange) - iptoint(minRange);
    }

    function CheckIPInRange(IP1,IP2, Mask, inCouldBeEmpty) {
        if (IP1 == '') return inCouldBeEmpty;
    }

    function CheckIP(Str,inCouldBeEmpty)
    {
        if (Str == "") return inCouldBeEmpty;
        return /^([01]?\d\d?|2[0-4]\d|25[0-5])\.([01]?\d\d?|2[0-4]\d|25[0-5])\.([01]?\d\d?|2[0-4]\d|25[0-5])\.([01]?\d\d?|2[0-4]\d|25[0-5])$/.test(Str);
        /*
        var regExpIP = new RegExp("^[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}$");
        if (!regExpIP.test(Str)) return false;
        var ipArray = Str.split(".");
        for (var i = 0; i < 4; i++) {
            if ((Math.floor(ipArray[i]) < 0) || (Math.floor(ipArray[i]) > 255)) return false;
        }
        return true;
        */
    }

    function checkDNSServers () {
        if( $("#LANDevice_-lanid-_HostConfig_DNSServers").attr('state') == "1" ) {
            for(var idx = 0; idx < 4; idx++) {
                var val = $("#LANDevice_-lanid-_HostConfig_DNSServers0_"+idx).val();
                if( (val == "") || (val < 0) || (val > 255) ) return false;
            }
        }
        return true;
    }

    
    /* ------------------------------------------- Reservation Table related functinos ------------------------------------ */
    
    function reservationTableCellRenderer(options)  {
        var td = $(options.td), 
            tr = $(options.tr),
            rowData = options.rowData,
            cellData = options.cellData, 
            colIndex = options.colIndex,

            actions, actEdit, actDel, reservation = rowData[3];

        if(colIndex === 0) {
            // set a unique id for this row to later on delete the cell
            tr.attr("id", 'reservation_' + reservation._index);
        }

        switch(colIndex) {
            case 3:
                // actions
                td.html([
                    '<div class="actions">',
                        '<a class="edit"><img src="../../img/edit.png" width="20px" alt="Edit" /></a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ',
                        '<a class="delete"><img src="../../img/delete.png" width="20px" alt="Delete" /></a> ',
                    '</div>'
                ].join(''));
                actions = td.find("div.actions");
                actEdit = actions.find("a.edit");
                actDel = actions.find("a.delete");
                
                actEdit.bind("click", function() {
                    reservationTable.cancelEdit();
                    reservationTable.editRow(options.rowIndex);
                });
                
                actDel.bind("click", function() {
                    var rowIdx = indexOfRow(reservation); // DO NOT USE options.rowIndex because when rows are deleted the indices change
                    Messages.clearAll();
                    reservationService.removeReservation(reservation.MACAddress, function(res) {
                        if(res.error) {
                            Messages.error(res.error);
                        }else {
                            reservationTable.removeRow(rowIdx);
                            Messages.info('Reserva de DHCP removida com sucesso.');
                        }
                    });
                });
                
                break;
            default:
                td.html(cellData);
                td.addClass("center");
                break;
        }
    }
    
    function reservationTableCellEditor(options) {
        var td = $(options.td),
            tr = $(options.tr),
            colIndex = options.colIndex,
            rowIndex = options.rowIndex,
            rowData = options.rowData,
            cellData = options.cellData,
            reservation = rowData[3],
            
            uiId = tr.attr("id"),
            fieldId,
            content;
            
        switch(colIndex) {
            case 0:
                fieldId = uiId + "_Hostname";
                break;
            case 1:
                fieldId = uiId + "_MACAddress";
                break;
            case 2:
                fieldId = uiId +"_IPAddress";
                break;
            default:
                break;
        }
        
        if(colIndex === 3) {
            content = $([
                '<div class=actions>',
                    '<a class="action save">Salvar</a>',
                    '<a class="action cancel secondary-action">Cancelar</a>',
                '</div>'
            ].join(''));
            
            // cancel modifications
            content.find("a.cancel").bind("click", function() {
                reservationTable.cancelEdit(rowIndex);
            });
            
            // save modifications
            content.find("a.save").bind("click", function() {
                var vRules = {}, rowValidator, modifiedReservation, arrKeys = ["Hostname", "MACAddress", "IPAddress"];
                
                // create temperory validator and its trules
                forEach(arrKeys, function(str) {
                    vRules[uiId + "_" + str] = reservationRules["reservation_" + str];
                });
                rowValidator = $.validator({rules:vRules, renderer: App.ValidationMessageRenderer()});
                
                if(rowValidator.validate()) {
                    modifiedReservation = util.agument({}, reservation);
                    forEach(arrKeys, function(k) {
                        var field = tr.find("#" + uiId + "_" + k);
                        modifiedReservation[k] = util.trim(field.val());
                    });
                    
                    reservationService.addReservation(modifiedReservation, function(res, addedReservations) {
                        if(res.error) {
                            Messages.error("Error updating row: " + res.error);
                            return;
                        }
                        var row = getReservationsTableData(addedReservations)[0];
                        reservationTable.updateRow(row, rowIndex);                        
                        $.Highlight(tr.get(0));
                    });
                }
            });
        }else {
            content = $(editorInputTemplate.process({
                type: "text",
                id: fieldId,
                value: cellData
            }));
        }
        
        td.replace(content);
    }
    
    function getReservationsTableData(arrReservations) {
        var reservationRows = [];
        forEach(arrReservations, function(l) {
            reservationRows[reservationRows.length] = [
                l.Hostname,
                l.MACAddress,
                l.IPAddress,
                l
            ];
        });
        return reservationRows;
    }
    function indexOfRow(reservation) {
        return reservationTable.indexOf(reservation, function(currRowData, searchReservation) {
            return searchReservation.MACAddress === currRowData[1]; // if the mac addresses are the same
        });
    }
    
    
    function initUI() {
        // initialize binder and populate data
        initBinder();
        
        $(".tiny").bind("change", function() {
            saveIPAddress(this.id);
        });

        $(".tinyDns").bind("change", function() {
            saveDNSServers();
        });

        $("#cancelLanConfig").bind("click", function() {
            updates = {};
            dhcpLanValidator.clear();
            populateDhcpForm(data);
        });
        
        $("#saveLanConfig").bind("click", function() {
            Messages.clearAll();
            if(dhcpLanValidator.validate()) {
                if (!checkIPRange()) {
                    Messages.error('Faixa de IPs não está inclusa na rede.');
                    return;
                }
                if (checkMaxMinRange() < 0) {
                    Messages.error('O primeiro endereço de IP é superior ao último endereço da faixa.');
                    return;
                }
                if (!checkDNSServers()) {
                    Messages.error('IP address do servidor de DNS não está correto');
                    return;
                }
                cli.rollback().write(updates).commit(function(res) {
                    if(res.error) {
                        Messages.error(res.error);
                        return;
                    }
                    Messages.info('Configurações do Roteador e DHCP salvas com sucesso.');
                    updates = {};
                });
            }
        });
        
        populateLeaseTable();
        
        var uiReservationIPAddress = $("#reservation_IPAddress"), uiReservationMACAddres = $("#reservation_MACAddress"), uiReservationHostname = $("#reservation_Hostname");

        $("#addReservation").bind("click", function() {
            var l, oldReservation;
            if(reservationValidator.validate()) {
                l = {
                    IPAddress: util.trim(uiReservationIPAddress.val()),
                    MACAddress: util.trim(uiReservationMACAddres.val()),
                    Hostname: util.trim(uiReservationHostname.val()),
                    User: 1
                };
                
                if( (oldReservation = reservationService.getReservationForIp(l.IPAddress)) && oldReservation.MACAddress !== l.MACAddress) {
                    Messages.error('Este endereço de IP já está atribuido para um endereço de MAC diferente.');
                    return;
                }
                
                // add the reservation
                reservationService.addReservation(l, function(res, addedReservations) {
                    if(res.error) {
                        Messages.error(res.error);
                        return;
                    }
                    var rows = getReservationsTableData(addedReservations);
                    forEach(rows, function(row) {
                        var reservation = row[3], idx = indexOfRow(reservation), uiRow;
                        
                        if(idx !== -1) { // an existing mapping was updated
                            reservationTable.updateRow(row, idx);
                        }else { // a new mapping was added
                            reservationTable.addRow(row);
                        }
                        
                        uiRow = reservationTable.$.find("tbody ").find("#reservation_" + reservation._index);
                        $.Highlight(uiRow); 
                    });
                    
                    // clear all the form fields
                    forEach([uiReservationHostname, uiReservationIPAddress, uiReservationMACAddres,$("#reservation_IPAddress0"),$("#reservation_IPAddress1"),$("#reservation_IPAddress2"),$("#reservation_IPAddress3")], function(ui) {
                        ui.val("");
                    });
                    Messages.info('Reserva DHCP de adicionada/atualizada com sucesso.');
                });
            }
        });
        
        // reservation table
        reservationTable = $.Table("#dhcpReservationTable", {
            data: getReservationsTableData(reservationService.getAllReservations()),
            renderer: reservationTableCellRenderer,
            editor: reservationTableCellEditor
        });
        
    }
    return {
        init: function(pageData) {
            data = pageData;
            cli = ConfigAccess(data.token);
            reservationService = DHCPReservationService(data.token, currLanId, data.LANDevice[currLanId].HostConfig.ClientTable);
            initUI();
            
        }
    };    
})(lite, App);





/* -------------------------------------------------- Port Forwarding Tab ------------------------------------------- */
var PortForwardingView = (function($, App) {
    var util = $.util, data, pmService, 
    
    Messages = App.MessageUtil,
    mappingTable,
    editorInputTemplate = $.template('<input type="text" class="{clazz}" id="{id}" value="{value}"></input>'),
    externalPortIsRange = false,
    vRules = {
        "Description": [
            {
                type: "required",
                message: 'Por favor, informe um nome (alfanumérico).'
            },
            {
                type: "pattern",
                pattern: /^[0-9A-Za-z_\-\.\&\s\(\)\[\]]+$/,
                message: 'O nome precisa ser alfanumérico.'
            }
        ],
        "ExternalPort": [
            {
                type: "required",
                message: 'Por favor, informe a(s) porta(s) ou a faixa.'
            },
            {
                type: ExternalPortValidator,
                message: 'Por favor informe uma faixa válida ex.: 1:65535'
            }
        ],
        
        "InternalPort": [
            {
                type: InternalPortValidator,
                message: 'Por favor informe uma faixa válida ex.: 1:65535'
            }
        ],
        "RemoteHost": [
            {
                type: "pattern",
                pattern: /^(|(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))$/,
                message: 'Por favor, informe um endereço de IP válido.'
            }
        ],
        "InternalClient": [
            {
                validateIf: function() {
                    return $("#InternalClient").val().length != 0;},
                type: "ipAddress",
                message: 'Por favor, informe um endereço de IP válido.',
            }
        ],
    },
    vRender = {
           "render": function(arrMsg) { if (arrMsg.length > 0) {$("#errMsg").html(arrMsg[0].message); $("#" + arrMsg[0].id).elements[0].focus();}},
           clear: function() {$("#errMsg").html('')}
 
       };
    
    validator = $.validator({rules:vRules, renderer: vRender});
    
    function InternalPortValidator(val,opts) {
        return (val.length == 0 && externalPortIsRange) ||
            (val.length > 0 && isPortInRange(val));
    }
    function ExternalPortValidator(val, opts)  {
        var arrPorts = val.split(","), valid = true;
        
        if(!util.trim(val)) {
            return false;
        }
        externalPortIsRange = arrPorts.length > 1;
        
        util.forEach(arrPorts, function(p) {
            var port = util.trim(p), numPort = Number(port), ranges, numRange;
            if(isNaN(numPort)) {
                externalPortIsRange = true;
                ranges = port.split(":");
                if(ranges.length !== 2 || !isPortInRange(ranges[0]) || !isPortInRange(ranges[1]) || (Number(ranges[0]) > Number(ranges[1])) ) {
                    opts.message = 'Por favor informe uma faixa válida ex.: 1:65535';
                    valid = false;
                }
            }else {
                if(!isPortInRange(numPort)) {
                    valid = false;
                }
            }
        });
        return valid;
    }

    function checkRangeSize(rangeInt, rangeExt){
        var intPortList = rangeInt.split(":");
        if ( intPortList.length == 2 ) {
            var extPortList = rangeExt.split(":");
            if ( extPortList.length != 2 ) {
                Messages.error('A faixa das portas de origem e portas de destino não possuem o mesmo tamanho.');
                $("#ExternalPort").addClass("invalid");
                $("#InternalPort").addClass("invalid");
                return false;
            }
            var intPortSize = parseInt(intPortList[1]) - parseInt(intPortList[0]) ;
            var extPortSize = parseInt(extPortList[1]) - parseInt(extPortList[0]) ;
            if (extPortSize != intPortSize){
                $("#ExternalPort").addClass("invalid");
                $("#InternalPort").addClass("invalid");
                Messages.error('A faixa das portas de origem e portas de destino não possuem o mesmo tamanho.');
                return false;
            }
        }
        $("#ExternalPort").removeClass("invalid");
        $("#InternalPort").removeClass("invalid");
        return true;
    }

    
    function isPortInRange(port) {
        var np = Number(port);
        return !(isNaN(np)) && (np > 0 && np < 65536);
    }
    
    /**
     * Cleans up the user entered string for port and port ranges, removing any spaces
     * @param {String} ports The user entered port string
     * @return {String} The cleaned up ports string to be submitted to backend
     */
    function getPortsAsString(ports) {
        var arrPorts = ports.split(","), ret = [];
        
        util.forEach(arrPorts, function(p) {
            var port = util.trim(p), ranges = port.split(":");
            if(ranges.length === 2) {
                ret[ret.length] = util.trim(ranges[0]) + ":" + util.trim(ranges[1]);
            }else {
                ret[ret.length] = port;
            }
        });
        return ret.join(",");
    }
    
    /**
     * Gets the port mappings as tabular data in the 5 column format 
     * [Description, Protocol, ExternalPort, InternalPort, RemoteHost, InternalClient, mapping object]
     * @param {Array} mappings An array of CLI PortMapping objects
     * @return {Array} An array of 5 column rows for table. Each row is an array with 6 elements
     */
    function getPortMappingsTableData(mappings) {
        var rows = [];
        util.forEach(mappings, function(m) {
            if (m.Type == 'man' && m.Description != 'GVT_PINHOLE'){
                rows[rows.length] = [m.Description, m.Protocol, m.ExternalPort, m.InternalPort,m.RemoteHost, m.InternalClient, m];
            }
        });
        return rows;
    }
    
    /**
     * Finds the row index in the table that matches the specified mapping.
     * @return The row index or -1 if the mapping was not found.
     */
    function indexOfRow(smapping) {
        return mappingTable.indexOf(smapping, function(currRowData, searchMapping) {
            return searchMapping.ExternalPort == currRowData[2] && searchMapping.Protocol == currRowData[1];
        });
    }
    
    /**
     * Table renderer for port forwarding data.
     */
    function portForwardingRenderer(options) {
        var td = $(options.td), 
            tr = $(options.tr),
            rowData = options.rowData,
            cellData = options.cellData, 
            colIndex = options.colIndex,
            mapping = rowData[6],

            actions, actEdit, actDel;

        // set a unique id for this row to later on delete the cell
        if(colIndex === 0) {
            tr.attr("id", 'pf_' + mapping._index);
        }
        
        switch(colIndex) {
            case 1: if ( cellData == "all" ) {
                            td.html('tcp/udp');
                        } else {
                            td.html(cellData);
                        }
                        break;
            case 2:
            case 3:
                // ports
                if(cellData) {
                    td.html(cellData.split(",").join(", "));
                }else {
                    td.html("");
                }
                break;
                
            case 6:
                td.html([
                    '<div class="actions">',
                        '<a class="edit"><img src="../../img/edit.png" width="20px" alt="Edit" /></a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ',
                        '<a class="delete"><img src="../../img/delete.png" width="20px" alt="Delete" /></a> ',
                    '</div>'
                ].join(''));
                actions = td.find("div.actions");
                actEdit = actions.find("a.edit");
                actDel = actions.find("a.delete");
                
                actEdit.bind("click", function() {
                    var idx = indexOfRow(mapping); // DO NOT USE options.rowIndex because when rows are deleted the indices change
                    mappingTable.cancelEdit();
                    mappingTable.editRow(idx);
                });
                
                actDel.bind("click", function() {
                    var rowIdx = indexOfRow(mapping);
                    Messages.clearAll();
                    pmService.removePortMapping(mapping, function(res) {
                        if(res.error) {
                            Messages.error(res.error);
                        }else {
                            mappingTable.removeRow(rowIdx);
                            Messages.info('Regra de redirecionamento de porta de apagada com sucesso.');
                        }
                    });
                });
                break;
                
            default:
                td.html(cellData);
                break;
        }
    }
    
    /**
     * Table editor for port forwarding data. Editor is responsible to show rows in edit mode, update the table data
     * (and backend if required)
     */
    function portForwardingEditor(options) {
        var td = $(options.td), 
            tr = $(options.tr),
            cellData = options.cellData, 
            colIndex = options.colIndex,
            rowData = options.rowData,
            mapping = rowData[6],
            rowIndex = options.rowIndex,
            
            uiId = tr.attr("id"),
            content = "";
            
        switch(colIndex) {
            case 0:
                content = $(editorInputTemplate.process({
                    clazz: "wide",
                    id: uiId + "_Description",
                    value: cellData
                }));
                break;
            case 1:
                var sel = $([
                    '<select id=' + uiId + '_Protocol>',
                        '<option value=tcp>TCP</option>',
                        '<option value=udp>UDP</option>',
                        '<option value=all>TODOS</option>',
                    '</select>'
                ].join(''));
                sel.val(cellData);
                content = sel;
                break;
            case 2:
                content = $(editorInputTemplate.process({
                    id: uiId + "_ExternalPort",
                    value: cellData
                }));
                break;
            case 3:
                content = $(editorInputTemplate.process({
                    id: uiId + "_InternalPort",
                    value: cellData
                }));
                break;
            case 4:
                content = $(editorInputTemplate.process({
                    id: uiId + "_RemoteHost",
                    value: cellData
                }));
                break;
            case 5:
                content = $(editorInputTemplate.process({
                    id: uiId + "_InternalClient",
                    value: cellData
                }));
                break;
            case 6:
                content = $([
                    '<div class=actions>',
                        '<a class="action save">Salvar</a>',
                        '<a class="action cancel secondary-action">Cancelar</a>',
                    '</div>'
                ].join(''));
                
                // cancel modifications
                content.find("a.cancel").bind("click", function() {
                    mappingTable.cancelEdit(rowIndex);
                });
                
                // save the changes 
                content.find("a.save").bind("click", function() {
                    var rules = {}, arrKeys = ["Description", "ExternalPort", "InternalPort", "RemoteHost", "InternalClient"],
                        newMapping;
                        /*
                        descKey = uiId + "_Description", 
                        protoKey = uiId + "_Protocol",
                        exPortKey = uiId + "_ExternalPort", 
                        intClientKey = uiId + "_RemoteHost",
                        intPortKey = uiId + "_InternalPort";
                        */
                       
                    // create temperory validation rules from existing ones.
                    util.forEach(arrKeys, function(str) {
                        if (str == "InternalClient") return;
                        rules[uiId + "_" + str] = vRules[str];
                    });
                    /* for validateIf on InternalClient we have to change validateIf*/
                    rules[uiId + "_InternalClient"] = [{
                        validateIf: function() { return $("#" + uiId + "_InternalClient").val().length != 0;},
                        type: "ipAddress",
                        message: 'Por favor, informe um endereço de IP válido.'
                    }];
                    // create a temperory validator
                    var rowValidator = $.validator({rules:rules, renderer: vRender});
                    if(rowValidator.validate()) {
                        //create a new mapping from old one. This is important as we also get the index of the mapping
                        newMapping = util.agument({}, mapping);
                        arrKeys.push("Protocol");
                        util.forEach(arrKeys, function(k) {
                            var field = tr.find("#" + uiId + "_" + k);
                            if(k === "ExternalPort" || k === "InternalPort") {
                                newMapping[k] = util.trim(field.val());
                            }else {
                                newMapping[k] = getPortsAsString(field.val())
                            }
                        });
                        
                        // console.log(JSON.stringify(newMapping, null, " "));
                        pmService.addPortMapping(newMapping, function() {
                            var rows = getPortMappingsTableData([newMapping]);
                            mappingTable.updateRow(rows[0], rowIndex);
                            $.Highlight(tr);
                        });
                    }
                });
                break;
            default:
                break;
        }
        // replace the existing read-only values with editable controls
        td.replace(content);
    }
    
    function initUI() {
        mappingTable = $.Table("#mappingTable", {
            data: getPortMappingsTableData(pmService.getPortMappings()),
            renderer: portForwardingRenderer,
            editor: portForwardingEditor
        });
        
        var uiDescription = $("#Description"),
            uiProtocol = $("#Protocol"),
            uiExternalPort = $("#ExternalPort"),
            uiInternalPort = $("#InternalPort"),
            uiRemoteHost = $("#RemoteHost"),
            uiInternalClient = $("#InternalClient");
            
       
        $("#cancelRule").bind("click", function() {
            validator.clear();
            uiDescription.val('');
            uiDescription.removeClass("invalid");
            uiExternalPort.val('');
            uiExternalPort.removeClass("invalid");
            uiRemoteHost.val('');
            uiRemoteHost.removeClass("invalid");
            uiInternalClient.val('');
            uiInternalClient.removeClass("invalid");
            uiInternalPort.val('');
            uiInternalPort.removeClass("invalid");
        });

        $("#addRule").bind("click", function() {
            Messages.clearAll();
            uiDescription.removeClass("invalid");
            uiExternalPort.removeClass("invalid");
            uiInternalPort.removeClass("invalid");
            uiRemoteHost.removeClass("invalid");
            uiInternalClient.removeClass("invalid");
            var m, intPort, intPortList, extPort, extPortList;
            if(validator.validate() && checkRangeSize( uiInternalPort.val(), uiExternalPort.val())) {
                m = {
                    Description: util.trim(uiDescription.val()),
                    ExternalPort: getPortsAsString(uiExternalPort.val()),
                    RemoteHost: util.trim(uiRemoteHost.val()),
                    InternalClient: util.trim(uiInternalClient.val()),
                    Protocol: uiProtocol.val(),
                    Enable: 1,
                    PortSurjection: 1,
                    Type: "man"
                };
                // check if internal Port is range or not for surjection.
                intPort = uiInternalPort.val();
                intPortList = uiInternalPort.val().split(":");
                if (intPortList.length == 2) {
                    extPort = uiExternalPort.val();
                    extPortList = uiInternalPort.val().split(":");
                    if (extPortList.length == 1) {
                        m.PortSurjection = 1;
                    } else {
                    m.PortSurjection = 0;
                    }
                    m.InternalPort = intPortList[0];
                } else {
                    m.PortSurjection = 0;
                    m.InternalPort = intPort;
                }
                
                // second argument to callback is the newly added array of mappings
                pmService.addPortMapping(m, function(res, addedMappings) {
                    if(res.error) {
                        Messages.error(res.error);
                    }else {
                        var rows = getPortMappingsTableData(addedMappings);
                        
                        // mappingTable.addRows(mappings);
                        util.forEach(rows, function(row) {
                            var m = row[6], idx = indexOfRow(m), uiRow;
                            if(idx !== -1) { // an existing mapping was updated
                                mappingTable.updateRow(row, idx);
                            }else { // a new mapping was added
                                mappingTable.addRow(row);
                            }
                            uiRow = mappingTable.$.find("tbody ").find("#pf_" + m._index);
                            $.Highlight(uiRow); 
                        });
                        
                        // clear form fields
                        util.forEach([uiDescription, uiExternalPort, uiInternalPort, uiRemoteHost, uiInternalClient], function(ui) {
                            ui.val("");
                        });
                        
                        Messages.info('Redirecionamento de Porta adicionado/atualizado com sucesso.');
                    }
                });
            }
        });
    }
    
    return {
        init: function(pageData) {
            data = pageData;
            var mList = data.wanPortMappingList.List;
            mList = (mList || "").split(",");
            if(mList.length) {
                data.wanPortMapping = data.wanPortMappingList[mList[0]].PortMapping;
            }
            
            pmService = PortMappingService(data.token, data.defaultConService, data.wanPortMapping);
            
            initUI();
        }
    };
})(lite, App);





/* --------------------------------------------------- DMZ Config Tab ----------------------------------------------- */
var DmzView = (function($, App) {
    var util = $.util, data, cli,
    
    // store lan IPs
    arrLanHostIp = [],

    Messages = App.MessageUtil,
    uiDmzState,
    uiDmzHost,
    uiOtherDmzHost,
    
    validator = validator = $.validator({
        rules:{
            otherDmzHost: [
                {type: "required", validateIf: isOtherHostInUse, message: 'Por favor, informe o endereço IP do dispositivo.'},
                {type: "ipAddress", validateIf: isOtherHostInUse, message: 'Por favor, informe um endereço de IP válido.'}
            ]
        }, 
        renderer: App.ValidationMessageRenderer()
    });
    
    function isOtherHostInUse() {
        return uiDmzState.attr("state") == 1 && (uiDmzHost.val() === "_other_");
    }
    
    function populateHosts() {
        var opts = [];
        util.forEach(data.lanHosts, function(host, idx) {
            if(idx === "Count") {
                return;
            }
            opts[opts.length] = ['<option value="', host.IPAddress, '">', (host.Hostname || host.IPAddress), '</option>'].join('');
            arrLanHostIp[arrLanHostIp.length] = host.IPAddress;
        });
        uiDmzHost.prepend(opts.join(''));
    }
    
    function populateDmzInfo() {
        var objDmz = data.wanDmzs, dmzIdxList = objDmz.List ? objDmz.List.split(',') : [], 
            wanId = data.activeConService || data.defaultConService,
            currDmz,
            ip;
        util.forEach(dmzIdxList, function(idx) {
            if(idx == wanId) {
                currDmz = objDmz[idx].DMZ;
                if (currDmz.Enable == 1) {
                    uiDmzState.attr("state", 1);
                    uiDmzState.setStyle({'backgroundPosition': '0px'});
                } else {
                    uiDmzState.attr("state", 0);
                    uiDmzState.setStyle({'backgroundPosition': '-34px'});
                }

                return util.Break;
            }
            return null;
        });
        
        if(currDmz) {
            ip = currDmz.IP;
            if(arrLanHostIp.indexOf(ip) === -1) {
                uiDmzHost.val("_other_");
                
                uiOtherDmzHost.removeClass("none").val(ip);
            }else {
                uiDmzHost.val(ip);
                uiOtherDmzHost.addClass("none");
            }
        }else {
            uiOtherDmzHost.removeClass("none");
        }
    }
    
    function initUI() {
        uiDmzHost = $("#dmzHost");
        uiOtherDmzHost = $("#otherDmzHost");
        uiDmzState = $("#dmzState");
        
        populateHosts();
        populateDmzInfo();
        
        uiDmzHost.bind("change", function() {
            validator.clear();
            if(uiDmzHost.val() === "_other_") {
                uiOtherDmzHost.removeClass("none");
            }else {
                uiOtherDmzHost.addClass("none");
            }
        });
        
        $("#saveDmz").bind("click", function() {
            if(validator.validate()) {
                saveDmzInfo();
            }
        });
        
        $("#cancelDmz").bind("click", function() {
            populateDmzInfo();
        });
    }
    
    function saveDmzInfo() {
        var wanIdx = data.activeConService || data.defaultConService,
            dmzEnabled = uiDmzState.attr("state"),
            hostIp = uiDmzHost.val(),
            ip =  hostIp === "_other_" ? util.trim(uiOtherDmzHost.val()) : hostIp,
            prefix = "WANConnectionDevice_" + wanIdx + "_DMZ",
            
            dmz; // used to update existing data after successful save
        var fw_rule = { 
            Enable:"1",
            Input:"1", 
            InputExt:"1", 
            OutputExt: "0", 
            Target:"Accept", 
            Chain: "Forward", 
            User:"1",
        };
            
        cli.rollback().write(prefix + "_Enable", dmzEnabled);

        if(dmzEnabled == 1) {
            cli.write(prefix + "_IP", ip);
            fw_rule.DstIPStart = ip;
            fw_rule.Description = prefix;
            FirewallService.addRules(cli, fw_rule);
        } else {
            FirewallService.delRulesWithDesc(cli, prefix);
        }
        cli.commit(function(res) {
            if(res.error) {
                Messages.error(res.error);
            }else {
                // update the existing data (since if user makes more modifications and presses cancel, the newly saved data
                // should be shown)
                dmz = data.wanDmzs["" + wanIdx];
                dmz.DMZ.Enable = (dmzEnabled);
                dmz.DMZ.IP = (dmzEnabled == 1 ? ip : "");
                Messages.info('Configuração de DMZ salva com sucesso.');
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





/* --------------------------------------------------- UPnP Config Tab ---------------------------------------------- */
var UpnpView = (function($, App) {
    var data, cli,
    
    Messages = App.MessageUtil,
    uiUpnpState;
    
    function populateUpnpInfo() {
        if (data.enableUpnp == 1 || data.enableUpnpMain == 1) {
            uiUpnpState.attr("state", 1);
            uiUpnpState.setStyle({'backgroundPosition': '0px'});
        } else {
            uiUpnpState.attr("state", 0);
            uiUpnpState.setStyle({'backgroundPosition': '-34px'});
        }
    }
    
    function initUI() {
        uiUpnpState = $("#upnpState");

        $("#saveUpnp").bind("click", function() {
            var enabled = uiUpnpState.attr("state");
            cli.rollback().write({
                Services_MiniUPnPd_Enable: enabled,
                Services_MiniUPnPd_EnableUPnP: enabled
            }).commit(function(res) {
                if(res.error) {
                    Messages.error(res.error);
                }else {
                    data.enableUpnp = enabled;
                    data.enableUpnpMain = enabled;
                    
                    Messages.info('Configuração de UPnP salva com sucesso.')
                }
            })
        });
        
        $("#cancelUpnp").bind("click", function() {
            populateUpnpInfo();
        });
        
        populateUpnpInfo();
    }
    
    return {
        init: function(pageData) {
            data = pageData;
            cli = ConfigAccess(data.token);
            
            initUI();
        }
    };    
})(lite, App);





/* ------------------------------------------------- Dyndns Config Tab ---------------------------------------------- */
var DynDnsView = (function($, App) {
    var util = $.util, data, cli,
    
    Messages = App.MessageUtil,
    validator = $.validator({
        rules:{
            "Services_DynDNS_1_Host": [
                {type: "required", message: 'Por favor, informe um nome de domínio.'},
                {
                    type: "pattern",
                    pattern: /^[a-zA-Z]([a-z0-9-]+)?(\.[a-z0-9-]+)*$/, // very simplistic validator.
                    message: 'Por favor, informe um nome de domínio válido.'
                }
            ],
            "Services_DynDNS_1_Username": {
                type: "required",
                message: 'Por favor, informe um nome de usuário.'
            }
        }, 
        renderer: App.ValidationMessageRenderer()
    }),
    
    updates = {},
    currDnsId = 1,
    dyndnsBinder;
    
    
    function switchFormatter(val, ctx) {
        var fld = ctx.field;
        if(ctx.operation === "read") {
//            return fld.attr("state");
        }else {
            if (val == "0" ) {
                fld.attr("state", val);
                fld.setStyle({'backgroundPosition': '-34px'});
            } else {
                fld.attr("state", val);
                fld.setStyle({'backgroundPosition': '0px'});
            }
            return null;
        }
    }
    function getDnsInUse() {
        var dnsObj = data.dynDns, dnsList = dnsObj.List ? dnsObj.List.split(",") : [], dnsInUse;
        util.forEach(dnsList, function(dnsIdx) {
            var dns = dnsObj[dnsIdx];
            if(dns.Enable == 1) {
                dnsInUse = {
                    id: dnsIdx,
                    dns: dns
                };
                return util.Break;
            }
            return null;
        });
        return dnsInUse || {
            id: currDnsId,
            dns: {}
        };
    }
    
    function populateForm() {
        var dnsInfo = getDnsInUse();
        if(dnsInfo) {
            // set the current dns id
            currDnsId = dnsInfo.id;
            
            dyndnsBinder.write({
                data: {
                    Services: {
                        DynDNS: data.dynDns
                    }
                },
                indices: {
                    dnsid: currDnsId
                }
            });
        }else {
            currDnsId = "1";
        }
    }
    
    function updateStatusUi(status, msg) {
        var uiTabContent = $("#dyndnsTabcontent"), 
            uiLabel = $("#Services_DynDNS_1_ErrorMessage"),
            uiStatus = uiTabContent.find(".dns-update-status");
            
        if(status === "failed") {
            uiStatus.removeClass("hidden").addClass("error");
            uiLabel.html(msg);
        }else {
            uiStatus.removeClass("error").addClass("hidden");
            uiLabel.html("");
        }
    }
    
    function fetchStatus() {
        var statusKey = "Services_DynDNS_" + currDnsId + "_Status", msgKey = "Services_DynDNS_" + currDnsId + "_ErrorMessage";
        cli.rollback().read([statusKey, msgKey])
            .commit(function(res) {
                if(!res.error) {
                    updateStatusUi((res[statusKey] || "").toLowerCase(), res[msgKey]);
                }else {
                    Messages.warn('Não foi possivel atualizar o estado. Por favor, tente novamente mais tarde.');
                }
            });
    }
    
    function setupBinder() {
        dyndnsBinder = App.DataBinder({
            fields: [
                "Services_DynDNS_1_Enable",
                //"Services_DynDNS_1_Status",
                //"Services_DynDNS_1_ErrorMessage",
                "Services_DynDNS_1_Server",
                "Services_DynDNS_1_Host",
                "Services_DynDNS_1_Username",
                "Services_DynDNS_1_Password"
            ],
            formatters: {
                "Services_DynDNS_1_Enable": switchFormatter,
                "Services_DynDNS_1_Password": function(val, ctx) {
                    // don't show passwords in the fields.
                    if(ctx.operation === "write") {
                        return "";
                    }
                    return val;
                }
            },
            onfieldchange: function(field, binder) {
                var objFld, val, fId = field.id;
                if(fId === "Services_DynDNS_1_Password") {
                    objFld = $(field);
                    val = util.trim(objFld.val());
                    if(val) {
                        updates["Services_DynDNS_" + currDnsId + "_Password"] = ConfigAccess.encrypt(data.token, val);
                    }else {
                        delete updates["Services_DynDNS_" + currDnsId + "_Password"];
                    }
                }else if(fId === "Services_DynDNS_1_Enable"){
                    objFld = $(field);

                    if (objFld.attr("state") == 0 ) {
                        morpheus(objFld.elements[0], { duration:300, backgroundPosition: '0px'});
                        objFld.attr("state", 1);
                    } else {
                        morpheus(objFld.elements[0], { duration:300, backgroundPosition: '-34px'});
                        objFld.attr("state", 0);
                    }

                    updates["Services_DynDNS_" + currDnsId + "_Enable"] = objFld.attr("state");
                }else {
                    binder.serialize({
                        target: updates,
                        indices: {
                            dnsid: currDnsId
                        }
                    }, fId);
                }
                // console.log(JSON.stringify(updates, null, ' '));
            }
        });
        
        populateForm();
        
    }
    
    function updateData() {
        cli.rollback().read("Services_DynDNS")
            .commit(function(res) {
                if(res.error) {
                    Messages.error('Erro ao obter dados do DDNS. Por favor, atualize a página.');
                }else {
                    Messages.info('Configuração de DDNS salva com sucesso.');
                    data.dynDns = res["Services_DynDNS"];
                }
            });
            
        if($("#Services_DynDNS_1_Enable").get(0).checked) {
            fetchStatus();
        }else {
            updateStatusUi(); // hide the status
        }
    }
    
    function initUI() {
        setupBinder();

        if($("#Services_DynDNS_1_Enable").get(0).checked) {
            updateStatusUi(
                $("#Services_DynDNS_1_Status").val().toLowerCase(),
                $("#Services_DynDNS_1_ErrorMessage").html()
            );
        }
        
        $("#saveDynDns").bind("click", function() {
            Messages.clearAll();
            if( $('#Services_DynDNS_1_Enable').attr('state') == "1") {
                if(validator.validate()) {
                    var modified;
                    for(key in updates) {
                        modified = true;
                        break;
                    }

                    if(!modified) {
                        Messages.info('Não ');
                        return;
                    }

                    cli.rollback().write(updates).write("Services_DynDNS_" + currDnsId + "_DomainAppending", 0).write("Services_DynDNS_" + currDnsId + "_DomainName", "").commit(function(res) {
                        if(res.error) {
                            Messages.error(res.error);
                        }else {
                            updates = {};
                            updateData();
                            $("#Services_DynDNS_1_Password").val("");
                        }
                    });
                }            
            }
            else {
                cli.rollback().write("Services_DynDNS_1_Enable", $('#Services_DynDNS_1_Enable').attr('state'));
                cli.commit(function(res) {
                    if(res.error) {
                        Messages.error(res.error);
                    }else {
                        updates = {};
                        updateData();
                        $("#Services_DynDNS_1_Password").val("");
                    }
                });
            }
        });
        
        $("#cancelDynDns").bind("click", function() {
            updates = {};
            validator.clear();
            $("#Services_DynDNS_1_Password").val("");
            populateForm();
        });
        
        $("#refreshUpdateStatus").bind("click", function() {
            fetchStatus();
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