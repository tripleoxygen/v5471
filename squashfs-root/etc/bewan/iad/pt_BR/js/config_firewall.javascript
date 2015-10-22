function validIPV6(aIP) {
var rgxp = /^([0-9a-f]{4})(\:([0-9a-f]{4})){7}$/;
return rgxp.test(aIP);
}


var Page = (function($, App) {
    var data, cli, lastindex = 1000;
    var util = $.util;
    isEdit = false;
    Messages = App.MessageUtil;

    vRule = {
        "ruleName": [
            {type: "required", message: 'Por favor, informe um nome (alfanumérico).'},
            {type: "pattern", pattern: /^[0-9A-Za-z_-]+$/, message: 'O nome de rede precisa ser alfanumérico.'}
        ],
        "localPort": [
            {type: "required", message: 'Por favor, informe a(s) porta(s) ou a faixa.'},
            {type: portValidator,message: 'Por favor informe uma faixa válida ex.: 1:65535'}
        ],
        "remotePort": [
            {type: "required", message: 'Por favor, informe a(s) porta(s) ou a faixa.'},
            {type: portValidator,message: 'Por favor informe uma faixa válida ex.: 1:65535'}
        ],
        "localIP": [
            { type: "required",message: 'Por favor, informe um endereço IP de destino.'},
            { type: "ipAddress4and6",message: 'Por favor, informe um endereço de IP válido.'}
        ],
        "remoteIP": [
            { type: "required",message: 'Por favor, informe um endereço IP de destino.'},
            { type: "ipAddress4and6",message: 'Por favor, informe um endereço de IP válido.'}
        ],
    };

    vRuleLine = {
        "ruleNameEdit": [
            {type: "required", message: 'Por favor, informe um nome (alfanumérico).'},
            {type: "pattern", pattern: /^[0-9A-Za-z_-]+$/, message: 'O nome de rede precisa ser alfanumérico.'}
        ],
        "localPortEdit": [
            {type: "required", message: 'Por favor, informe a(s) porta(s) ou a faixa.'},
            {type: portValidator,message: 'Por favor informe uma faixa válida ex.: 1:65535'}
        ],
        "remotePortEdit": [
            {type: "required", message: 'Por favor, informe a(s) porta(s) ou a faixa.'},
            {type: portValidator,message: 'Por favor informe uma faixa válida ex.: 1:65535'}
        ],
        "localIPEdit": [
            { type: "required",message: 'Por favor, informe um endereço IP de destino.'},
            { type: "ipAddress4and6",message: 'Por favor, informe um endereço de IP válido.'}
        ],
        "remoteIPEdit": [
            { type: "required",message: 'Por favor, informe um endereço IP de destino.'},
            { type: "ipAddress4and6",message: 'Por favor, informe um endereço de IP válido.'}
        ],
    };

    ruleValidator = $.validator({rules: vRule, renderer: App.ValidationMessageRenderer()});
    ruleValidatorLine = $.validator({rules: vRuleLine, renderer: App.ValidationMessageRenderer()});

    function portValidator(val, opts)  {
        var arrPorts = val.split(","), valid = true;
        if (val == '*') {
            return true;
        }
        if(!util.trim(val)) {
            return false;
        }
        util.forEach(arrPorts, function(p) {
            var port = util.trim(p), numPort = Number(port), ranges, numRange;
            if(isNaN(numPort)) {
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
                $("#srcPort").addClass("invalid");
                $("#dstPort").addClass("invalid");
                return false;
            }
            var intPortSize = parseInt(intPortList[1]) - parseInt(intPortList[0]) ;
            var extPortSize = parseInt(extPortList[1]) - parseInt(extPortList[0]) ;
            if (extPortSize != intPortSize){
                $("#srcPort").addClass("invalid");
                $("#dstPort").addClass("invalid");
                Messages.error('A faixa das portas de origem e portas de destino não possuem o mesmo tamanho.');
                return false;
            }
        }
        $("#srcPort").removeClass("invalid");
        $("#dstPort").removeClass("invalid");
        return true;
    }

    function isIPv4(str) {
        var regExp = /^([01]?\d\d?|2[0-4]\d|25[0-5])\.([01]?\d\d?|2[0-4]\d|25[0-5])\.([01]?\d\d?|2[0-4]\d|25[0-5])\.([01]?\d\d?|2[0-4]\d|25[0-5])$/;
        return regExp.test(str);
    }

    function isIPv6(str) {
        var regExp = /^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/;
        return regExp.test(str);
    }

    function checkIPsFormat(firstIP, secondIP){
        if (firstIP == '*' || secondIP == '*') return true;
        if ( isIPv4(firstIP) && isIPv4(secondIP)) return true;
        if ( isIPv6(firstIP) && isIPv6(secondIP)) return true;
        Messages.error('Local IP and remote IP have a different format');
        return false;
    }
    
    function isPortInRange(port) {
        var np = Number(port);
        return !(isNaN(np)) && (np > 0 && np < 65536);
    }

    function changeDefaultPolicy(value){
        cli.rollback();
        cli.write("Firewall_DefaultPolicy", value);
        cli.write("Firewall_DefaultPolicy6", value);
        cli.commit(function(res) {
            if(!res.error) {
                Messages.info('Politica padrão alterada com sucesso.');
                if (value == 'Accept') {
                    $("#defaultimg").html('<img src="../../img/acptRemote.png">');
                } else {
                    $("#defaultimg").html('<img src="../../img/rjctRemote.png">');
                }
            }
        });
    }

    function removeRule(index){
        if (isEdit) {
            alert('Por favor, salve ou cancele a edição da regra');
            return;
        }
        Messages.clearAll();
        cli.rollback();
        cli.remove("Firewall_Rules_"+index);
        cli.commit(function(res) {
            if(!res.error) {
                Messages.info('Regra de Filtro de MAC removida com sucesso.');
                
            }
        });
        $("#rules"+index).addClass("none");
    }

    function editRule(index){
        if (isEdit) {
            alert('Por favor, salve ou cancele a edição da regra');
            return;
        }
        isEdit = true;
        Messages.clearAll();
        var trBody ='';
        var tr = document.getElementById('rules'+index);
        var cells = tr.getElementsByTagName('td');
        for (var i=0 ; i<8; i++) {
            switch(i) {
                case 0: trBody += '<td><input id="ruleNameEdit" type="text" value="'+cells[i].innerHTML+'"  oldvalue="'+cells[i].innerHTML+'" style="font-size:10px" class="tiny"></td>';
                            break;
                case 1: trBody += '<td><select id="protocolEdit"  style="font-size:10px"  oldvalue="'+cells[i].innerHTML+'" ><option value="tcp" '+ (cells[i].innerHTML == "tcp" ? "selected":"")+'>TCP</option><option value="udp" '+ (cells[i].innerHTML == "udp" ? "selected":"")+'>UDP</option><option value="tcp,udp" '+ (cells[i].innerHTML == "udp,tcp" ? "selected":"")+'>All</option></select></td>';
                            break;
                case 2: trBody += '<td><input id="localPortEdit" type="text" value="'+cells[i].innerHTML+'"  oldvalue="'+cells[i].innerHTML+'" style="font-size:10px" class="tiny"></td>';
                            break;
                case 3: trBody += '<td><input id="localIPEdit" type="text" value="'+cells[i].innerHTML+'" oldvalue="'+cells[i].innerHTML+'" style="font-size:10px" class="medium"></td>';
                            break;
                case 4 : trBody += '<td><select  id="actionEdit" style="font-size:10px"  oldvalue="'+cells[i].firstChild.getAttribute('src')+'">\
                                                        <option value="acptLocal" '+ (cells[i].innerHTML.indexOf('acptLocal') != -1 ? "selected":"")+'>Aceitar local</option>\
                                                        <option value="acptRemote" '+ (cells[i].innerHTML.indexOf('acptRemote') != -1 ? "selected":"")+'>Aceitar remoto</option>\
                                                        <option value="rjctLocal" '+ (cells[i].innerHTML.indexOf('rjctLocal') != -1 ? "selected":"")+'>Rejeitar local</option>\
                                                        <option value="rjctRemote" '+ (cells[i].innerHTML.indexOf('rjctRemote') != -1 ? "selected":"")+'>Rejeitar remoto</option>\
                                                    </select></td>';
                            break;
                case 5 : trBody += '<td><input id="remoteIPEdit" type="text" value="'+cells[i].innerHTML+'" oldvalue="'+cells[i].innerHTML+'" style="font-size:10px" class="medium"></td>';
                            break;
                case 6: trBody += '<td><input id="remotePortEdit" type="text" value="'+cells[i].innerHTML+'"  oldvalue="'+cells[i].innerHTML+'" style="font-size:10px" class="tiny"></td>';
                            break; 
                case 7: trBody += '<td><div class="actions"><a class="action save" onclick="Page.save(\''+index+'\');" >Save</a><br><br><a class="action cancel secondary-action"  onclick="Page.cancel(\''+index+'\');" >Cancel</a></div></td>';
                            break;
                default: break;
            }
        }

        $("#rules"+index).html(trBody);
    }

    function cancelRule(index){
        isEdit = false;
        Messages.clearAll();
        var trBody ='';
        var tr = document.getElementById('rules'+index);
        var cells = tr.getElementsByTagName('td');
        for (var i=0 ; i<8; i++) {
            switch(i) {
                case 4: trBody += '<td><img src="'+cells[i].firstChild.getAttribute("oldvalue")+'"></td>';
                break;
                case 3:
                case 5:  trBody += '<td class="ellipsis" title='+cells[i].firstChild.getAttribute("oldvalue")+'>'+cells[i].firstChild.getAttribute("oldvalue")+'</td>';
                            break;
                case 7: trBody += '<td><img width="20px" onclick="Page.edit(\''+index+'\');" alt="Edit" src="../../img/edit.png"  style="cursor:pointer"> \
                                                        <img width="20px" onclick="Page.remove(\''+index+'\');" alt="Delete" src="../../img/delete.png"  style="cursor:pointer"> \
                                                        <img onclick="Page.up(\''+index+'\');" alt="Up" src="../../img/arrow_up.png"  style="cursor:pointer; padding-bottom:6px"> \
                                                        <img onclick="Page.down(\''+index+'\');" alt="Down" src="../../img/arrow_down.png"  style="cursor:pointer; padding-bottom:6px"></td>';
                             break;
                default: trBody += '<td>'+cells[i].firstChild.getAttribute("oldvalue")+'</td>';
                            break;
            }
        }

        $("#rules"+index).html(trBody);
    }

    function saveRule(index){
        Messages.clearAll();
        ruleValidatorLine.clear();
        if(ruleValidatorLine.validate()  && checkIPsFormat($("#remoteIPEdit").val(), $("#localIPEdit").val())) {
            isEdit = false
            cli.rollback();
            cli.write("Firewall_Rules_"+index+ "_Description", $("#ruleNameEdit").val());
            cli.write("Firewall_Rules_"+index+ "_Protos", $("#protocolEdit").val());

            var localIP = ($("#localIPEdit").val() == '*') ? '' : $("#localIPEdit").val();
            var remoteIP = ($("#remoteIPEdit").val() == '*') ? '' : $("#remoteIPEdit").val();
            var localPort = ($("#localPortEdit").val() == '*') ? '' : $("#localPortEdit").val();
            var remotePort = ($("#remotePortEdit").val() == '*') ? '' : $("#remotePortEdit").val();

            if (localIP == '' && remoteIP == '') {
                cli.write("Firewall_Rules_"+index+ "_IPProtocol", 'IPv4+IPv6');
            } else if ( isIPv4(localIP) || isIPv4(remoteIP)) {
                cli.write("Firewall_Rules_"+index+ "_IPProtocol", 'IPv4');
            } else {
                cli.write("Firewall_Rules_"+index+ "_IPProtocol", 'IPv6');
            }

            if ($("#actionEdit").val() == "rjctLocal" || $("#actionEdit").val() == "acptLocal" ) {
                cli.write("Firewall_Rules_"+index+ "_SrcPorts", localPort);
                cli.write("Firewall_Rules_"+index+ "_DstPorts", remotePort);
                cli.write("Firewall_Rules_"+index+ "_SrcIPStart", localIP);
                cli.write("Firewall_Rules_"+index+ "_DstIPStart", remoteIP);
                cli.write("Firewall_Rules_"+index+ "_OutputExt", 1);
                cli.write("Firewall_Rules_"+index+ "_InputExt", 0);
                cli.write("Firewall_Rules_"+index+ "_Input", '');
                cli.write("Firewall_Rules_"+index+ "_Output", data.ICS);
            } else {
                cli.write("Firewall_Rules_"+index+ "_SrcPorts", remotePort);
                cli.write("Firewall_Rules_"+index+ "_DstPorts", localPort);
                cli.write("Firewall_Rules_"+index+ "_SrcIPStart", remoteIP);
                cli.write("Firewall_Rules_"+index+ "_DstIPStart", localIP);
                cli.write("Firewall_Rules_"+index+ "_InputExt", 1);
                cli.write("Firewall_Rules_"+index+ "_OutputExt", 0);
                cli.write("Firewall_Rules_"+index+ "_Output", '');
                cli.write("Firewall_Rules_"+index+ "_Input", data.ICS);
            }
            if ($("#actionEdit").val() == "rjctLocal") {
                cli.write("Firewall_Rules_"+index+ "_Target", 'RejectPort');
            } else if ( $("#actionEdit").val() == "rjctRemote" ) {
                cli.write("Firewall_Rules_"+index+ "_Target", 'Drop');
            }
            else  {
                cli.write("Firewall_Rules_"+index+ "_Target", 'Accept');
            }
            cli.commit(function(res) {
                if(res.error) {
                    Messages.error(res.error);
                }   else {
                    Messages.info('Modo da WAN alterado com sucesso.');
                    clearRule();
                    var trBody ='';
                    var tr = document.getElementById('rules'+index);
                    var cells = tr.getElementsByTagName('td');
                    for (var i=0 ; i<8; i++) {
                        switch(i) {
                            case 4: trBody += '<td><img src="../../img/'+cells[i].firstChild.value+'.png"></td>';
                                        break;
                            case 7: trBody += '<td><img width="20px" onclick="Page.edit(\''+index+'\');" alt="Edit" src="../../img/edit.png"  style="cursor:pointer"> \
                                                           <img width="20px" onclick="Page.remove(\''+index+'\');" alt="Delete" src="../../img/delete.png"  style="cursor:pointer"> \
                                                           <img onclick="Page.up(\''+index+'\');" alt="Up" src="../../img/arrow_up.png"  style="cursor:pointer; padding-bottom:6px"> \
                                                           <img onclick="Page.down(\''+index+'\');" alt="Down" src="../../img/arrow_down.png"  style="cursor:pointer; padding-bottom:6px"></td>';
                                        break;
                            default: trBody += '<td>'+cells[i].firstChild.value+'</td>';
                                        break;
                        }
                    }
                    $("#rules"+index).html(trBody);
                }
            });
        }   
    }

    function changePriorityRule(index,option){
        // if option = 1 ===> up
        // if option = 0 ===> down
        if (isEdit) {
            alert('Por favor, salve ou cancele a edição da regra');
            return;
        }
        Messages.clearAll();
        var table = document.getElementById('rulesListBody');
        var list = table.getElementsByTagName('tr');
        var realList = new Array();
        var j = 0;
        for (var i = 0 ; i < list.length; i++) {
            if (list[i].className == 'none') {
                continue;
            }
            realList[j] = list[i];
            j++;
        }
        for (var i = 0 ; i < realList.length; i++) {
            if (index == realList[i].id.substr(5,8)) {
                if (i == 0 && option == 1) return;
                if ( (i == realList.length -1 || i == realList.length -2 ) && option == 0) return;
                if (option == 1 ) var indexBis = realList[i-1].id.substr(5,8);
                if (option == 0 ) var indexBis = realList[i+1].id.substr(5,8);
                var tr = document.getElementById('rules'+index);
                var cells = tr.getElementsByTagName('td');
                var trBis = document.getElementById('rules'+indexBis);
                var cellsBis = trBis.getElementsByTagName('td');
                var direction ;
                var from ;
                if ( cells[4].innerHTML.indexOf('Local') != -1 && cellsBis[4].innerHTML.indexOf('Local') != -1) { 
                    direction = true;
                    from ='local';
                }  else if (cells[4].innerHTML.indexOf('Remote') != -1 && cellsBis[4].innerHTML.indexOf('Remote') != -1 ) {
                    direction = true;
                    from ='remote';
                } else {
                    direction = false;
                    if ( cells[4].innerHTML.indexOf('Local') != -1) {
                        from ='local';
                    } else {
                        from ='remote';
                    }
                }

                cli.rollback();
                cli.write("Firewall_Rules_"+index+ "_Description", cellsBis[0].innerHTML); 
                cli.write("Firewall_Rules_"+indexBis+ "_Description", cells[0].innerHTML); 
                cli.write("Firewall_Rules_"+index+ "_Protos", cellsBis[1].innerHTML); 
                cli.write("Firewall_Rules_"+indexBis+ "_Protos", cells[1].innerHTML);
                if (direction) {
                    if ( from == 'local') {
                        cli.write("Firewall_Rules_"+index+ "_SrcPorts", (cellsBis[2].innerHTML == '*' ) ? '' : cellsBis[2].innerHTML); 
                        cli.write("Firewall_Rules_"+indexBis+ "_SrcPorts", (cells[2].innerHTML == '*' ) ? '' : cells[2].innerHTML);
                        cli.write("Firewall_Rules_"+index+ "_DstPorts", (cellsBis[6].innerHTML == '*' ) ? '' : cellsBis[6].innerHTML); 
                        cli.write("Firewall_Rules_"+indexBis+ "_DstPorts", (cells[6].innerHTML == '*' ) ? '' : cells[6].innerHTML);
                        cli.write("Firewall_Rules_"+index+ "_SrcIPStart", (cellsBis[3].innerHTML == '*' ) ? '' : cellsBis[3].innerHTML); 
                        cli.write("Firewall_Rules_"+indexBis+ "_SrcIPStart", (cells[3].innerHTML == '*' ) ? '' : cells[3].innerHTML);
                        cli.write("Firewall_Rules_"+index+ "_DstIPStart", (cellsBis[5].innerHTML == '*' ) ? '' : cellsBis[5].innerHTML); 
                        cli.write("Firewall_Rules_"+indexBis+ "_DstIPStart", (cells[5].innerHTML == '*' ) ? '' : cells[5].innerHTML); 
                    } else {
                        cli.write("Firewall_Rules_"+index+ "_SrcPorts", (cellsBis[6].innerHTML == '*' ) ? '' : cellsBis[6].innerHTML); 
                        cli.write("Firewall_Rules_"+indexBis+ "_SrcPorts", (cells[6].innerHTML == '*' ) ? '' : cells[6].innerHTMLL);
                        cli.write("Firewall_Rules_"+index+ "_DstPorts", (cellsBis[2].innerHTML == '*' ) ? '' : cellsBis[2].innerHTMLL); 
                        cli.write("Firewall_Rules_"+indexBis+ "_DstPorts", (cells[2].innerHTML == '*' ) ? '' : cells[2].innerHTML);
                        cli.write("Firewall_Rules_"+index+ "_SrcIPStart", (cellsBis[5].innerHTML == '*' ) ? '' : cellsBis[5].innerHTML); 
                        cli.write("Firewall_Rules_"+indexBis+ "_SrcIPStart", (cells[5].innerHTML == '*' ) ? '' : cells[5].innerHTML);
                        cli.write("Firewall_Rules_"+index+ "_DstIPStart", (cellsBis[3].innerHTML == '*' ) ? '' : cellsBis[3].innerHTML); 
                        cli.write("Firewall_Rules_"+indexBis+ "_DstIPStart", (cells[3].innerHTML == '*' ) ? '' : cells[3].innerHTML); 
                    }
                } else {
                    if ( from == 'local') {
                        cli.write("Firewall_Rules_"+index+ "_SrcPorts", (cellsBis[6].innerHTML == '*' ) ? '' : cellsBis[6].innerHTML); 
                        cli.write("Firewall_Rules_"+indexBis+ "_DstPorts", (cells[6].innerHTML == '*' ) ? '' : cells[6].innerHTML);
                        cli.write("Firewall_Rules_"+indexBis+ "_SrcPorts", (cells[2].innerHTML == '*' ) ? '' : cells[2].innerHTML);
                        cli.write("Firewall_Rules_"+index+ "_DstPorts", (cellsBis[2].innerHTML == '*' ) ? '' : cellsBis[2].innerHTML); 
                        cli.write("Firewall_Rules_"+index+ "_SrcIPStart", (cellsBis[5].innerHTML == '*' ) ? '' : cellsBis[5].innerHTML);
                        cli.write("Firewall_Rules_"+indexBis+ "_DstIPStart", (cells[5].innerHTML == '*' ) ? '' : cells[5].innerHTML); 
                        cli.write("Firewall_Rules_"+indexBis+ "_SrcIPStart", (cells[3].innerHTML == '*' ) ? '' : cells[3].innerHTML);
                        cli.write("Firewall_Rules_"+index+ "_DstIPStart", (cellsBis[3].innerHTML == '*' ) ? '' : cellsBis[3].innerHTML); 
                        

                
                    } else {
                        cli.write("Firewall_Rules_"+index+ "_SrcPorts", (cellsBis[2].innerHTML == '*' ) ? '' : cellsBis[2].innerHTML); 
                        cli.write("Firewall_Rules_"+indexBis+ "_DstPorts", (cells[2].innerHTML == '*' ) ? '' : cells[2].innerHTML);
                        cli.write("Firewall_Rules_"+indexBis+ "_SrcPorts", (cells[6].innerHTML == '*' ) ? '' : cells[6].innerHTMLL);
                        cli.write("Firewall_Rules_"+index+ "_DstPorts", (cellsBis[6].innerHTML == '*' ) ? '' : cellsBis[6].innerHTML); 
                        cli.write("Firewall_Rules_"+index+ "_SrcIPStart", (cellsBis[3].innerHTML == '*' ) ? '' : cellsBis[3].innerHTML);
                        cli.write("Firewall_Rules_"+indexBis+ "_DstIPStart", (cells[3].innerHTML == '*' ) ? '' : cells[3].innerHTML); 
                        cli.write("Firewall_Rules_"+indexBis+ "_SrcIPStart", (cells[5].innerHTML == '*' ) ? '' : cells[5].innerHTML);
                        cli.write("Firewall_Rules_"+index+ "_DstIPStart", (cellsBis[5].innerHTML == '*' ) ? '' : cellsBis[5].innerHTML); 
                    }
                }

                if (cells[4].innerHTML.indexOf('acpt') != -1) {
                    cli.write("Firewall_Rules_"+indexBis+ "_Target", 'Accept'); 
                } else if (cells[4].innerHTML.indexOf('Local') != -1) { 
                    cli.write("Firewall_Rules_"+indexBis+ "_Target", 'RejectPort');
                } else {
                    cli.write("Firewall_Rules_"+indexBis+ "_Target", 'Drop');
                }
                if (cellsBis[4].innerHTML.indexOf('acpt') != -1) {
                    cli.write("Firewall_Rules_"+index+ "_Target", 'Accept'); 
                } else {
                    cli.write("Firewall_Rules_"+index+ "_Target", 'Drop'); 
                }
                if (!direction) {
                    if ( from == 'local') {
                        cli.write("Firewall_Rules_"+index+ "_InputExt", 1);
                        cli.write("Firewall_Rules_"+index+ "_Input", data.ICS);
                        cli.write("Firewall_Rules_"+index+ "_OutputExt", 0);
                        cli.write("Firewall_Rules_"+index+ "_Output", '');
                        cli.write("Firewall_Rules_"+indexBis+ "_InputExt", 0);
                        cli.write("Firewall_Rules_"+indexBis+ "_Input", '');
                        cli.write("Firewall_Rules_"+indexBis+ "_OutputExt", 1);
                        cli.write("Firewall_Rules_"+indexBis+ "_Output", data.ICS);
                    } else {
                        cli.write("Firewall_Rules_"+index+ "_InputExt", 0);
                        cli.write("Firewall_Rules_"+index+ "_Input", '');
                        cli.write("Firewall_Rules_"+index+ "_OutputExt", 1);
                        cli.write("Firewall_Rules_"+index+ "_Output", data.ICS);
                        cli.write("Firewall_Rules_"+indexBis+ "_InputExt", 1);
                        cli.write("Firewall_Rules_"+indexBis+ "_OutputExt", 0);
                        cli.write("Firewall_Rules_"+indexBis+ "_Output", '');
                        cli.write("Firewall_Rules_"+indexBis+ "_Input", data.ICS);
                    }
                }

                if (cells[3].innerHTML == '*' && cells[5].innerHTML == '*') {
                    cli.write("Firewall_Rules_"+indexBis+ "_IPProtocol", 'IPv4+IPv6');
                } else if ( isIPv4(cells[3].innerHTML) ||  isIPv4(cells[5].innerHTML)) {
                    cli.write("Firewall_Rules_"+indexBis+ "_IPProtocol", 'IPv4');
                } else {
                    cli.write("Firewall_Rules_"+indexBis+ "_IPProtocol", 'IPv6');
                }
                if (cellsBis[3].innerHTML == '*' && cellsBis[5].innerHTML == '*') {
                    cli.write("Firewall_Rules_"+index+ "_IPProtocol", 'IPv4+IPv6');
                } else if ( isIPv4(cellsBis[3].innerHTML) ||  isIPv4(cellsBis[5].innerHTML)) {
                    cli.write("Firewall_Rules_"+index+ "_IPProtocol", 'IPv4');
                } else {
                    cli.write("Firewall_Rules_"+index+ "_IPProtocol", 'IPv6');
                }

                for (var j=0 ; j<7; j++) {
                    var oldvalue = cellsBis[j].innerHTML; 
                    cellsBis[j].innerHTML = cells[j].innerHTML;
                    cells[j].innerHTML = oldvalue ;
                }       
                
                cli.commit(function(res) {
                    if(res.error) {
                        Messages.error(res.error);
                    }   else {
                    }
                });
                break;
            }
        }
    }

    function populateRulesList(){
        allMACFilters = {};
        var rulesTable = $("#rulesListBody");
        var rules=data.rules;
        var rulesList = rules.List.split(',');
        rulesList.sort();
        var tableBody='';
        var localIP,localPort, remoteIP,remotePort, action;
        var action, defaultAction;
        if (rules.List != '') {
            for (var i in rulesList) {
                if (rules[rulesList[i]]["User"] == 1 && rules[rulesList[i]]["Enable"] == 1 ) {
                    if (rules[rulesList[i]]["OutputExt"] == 1) {
                        localIP = rules[rulesList[i]]["SrcIPStart"];
                        localPort = rules[rulesList[i]]["SrcPorts"];
                        remoteIP = rules[rulesList[i]]["DstIPStart"];
                        remotePort = rules[rulesList[i]]["DstPorts"];
                        if (rules[rulesList[i]]["Target"] == 'Accept') {
                            action = 'acptLocal';
                        } else {
                            action = 'rjctLocal';
                        }
                    } else {
                        localIP = rules[rulesList[i]]["DstIPStart"];
                        localPort = rules[rulesList[i]]["DstPorts"];
                        remoteIP = rules[rulesList[i]]["SrcIPStart"];
                        remotePort = rules[rulesList[i]]["SrcPorts"];
                        if (rules[rulesList[i]]["Target"] == 'Accept') {
                            action = 'acptRemote';
                        } else {
                            action = 'rjctRemote';
                        }
                    }
                    if (localIP == '' ) localIP  = '*';
                    if (remoteIP == '' ) remoteIP  = '*';
                    if (localPort == '' ) localPort  = '*';
                    if (remotePort == '' ) remotePort  = '*';
                    tableBody +=  '<tr id="rules'+rulesList[i]+'"><td>'+rules[rulesList[i]]["Description"]+'</td><td>'+rules[rulesList[i]]["Protos"]+'</td>\
                                            <td>'+localPort+'</td><td class="ellipsis"  title='+localIP+'>'+localIP+'</td>\
                                            <td><img src="../../img/'+action+'.png"></td>\
                                            <td class="ellipsis" title='+remoteIP+'>'+remoteIP+'</td><td>'+remotePort+'</td>\
                                            <td class="actions"><img width="20px" onclick="Page.edit(\''+rulesList[i]+'\');" alt="Edit" src="../../img/edit.png"  style="cursor:pointer"> \
                                                    <img width="20px" onclick="Page.remove(\''+rulesList[i]+'\');" alt="Delete" src="../../img/delete.png"  style="cursor:pointer"> \
                                                    <img onclick="Page.up(\''+rulesList[i]+'\');" alt="Up" src="../../img/arrow_up.png"  style="cursor:pointer; padding-bottom:6px"> \
                                                    <img onclick="Page.down(\''+rulesList[i]+'\');" alt="Down" src="../../img/arrow_down.png"  style="cursor:pointer; padding-bottom:6px"> \
                                            </td></tr>';
                    lastindex = rulesList[i];
                }
            }
        }
        if (data.default == 'Accept') {
            defaultAction ='acptRemote';
            document.getElementById('defaultPolicyAcpt').checked=true;
        } else {
            defaultAction ='rjctRemote';
            document.getElementById('defaultPolicyRjct').checked=true;
        }
        tableBody +=  '<tr><td>Padrão</td><td>tcp,udp</td><td>*</td><td>*</td><td id="defaultimg"><img src="../../img/'+defaultAction+'.png"></td><td>*</td><td>*</td><td></td></tr>';
        rulesTable.html(tableBody);
    }
    
    function clearRule() {
        $("#ruleName").val('');
        $("#protocol").val('tcp');
        $("#localPort").val('');
        $("#localIP").val('');
        $("#remotePort").val('');
        $("#remoteIP").val('');
    }  
   
    function initUI() {
        // initialize binder and populate data
        populateRulesList();

        $("#clear").bind("click", function() {
            clearRule();
        });
        $('#Action').val('acptLocal');
        $('#Action').bind("change", function() {
            $('#imgAction').html('<img src="../../img/'+this.value+'.png">');
        });

        $("#add").bind("click", function() {
            var datas;
            ruleValidator.clear();
            Messages.clearAll();
            if(ruleValidator.validate() && checkIPsFormat($("#remoteIP").val(), $("#localIP").val())) {
                lastindex ++ ;
                cli.rollback();
                cli.write("Firewall_Rules_"+lastindex+ "_Enable", 1);
                cli.write("Firewall_Rules_"+lastindex+ "_User", 1);
                cli.write("Firewall_Rules_"+lastindex+ "_Description", $("#ruleName").val());
                cli.write("Firewall_Rules_"+lastindex+ "_Protos", $("#protocol").val());

                var localIP = ($("#localIP").val() == '*') ? '' : $("#localIP").val();
                var remoteIP = ($("#remoteIP").val() == '*') ? '' : $("#remoteIP").val();
                var localPort = ($("#localPort").val() == '*') ? '' : $("#localPort").val();
                var remotePort = ($("#remotePort").val() == '*') ? '' : $("#remotePort").val();

                if (localIP == '' && remoteIP == '') {
                    cli.write("Firewall_Rules_"+lastindex+ "_IPProtocol", 'IPv4+IPv6');
                } else if ( isIPv4(localIP) ||  isIPv4(remoteIP)) {
                    cli.write("Firewall_Rules_"+lastindex+ "_IPProtocol", 'IPv4');
                } else {
                    cli.write("Firewall_Rules_"+lastindex+ "_IPProtocol", 'IPv6');
                }

                if ($("#Action").val() == "rjctLocal" || $("#Action").val() == "acptLocal" ) {
                    cli.write("Firewall_Rules_"+lastindex+ "_SrcPorts", localPort);
                    cli.write("Firewall_Rules_"+lastindex+ "_DstPorts", remotePort);
                    cli.write("Firewall_Rules_"+lastindex+ "_SrcIPStart", localIP);
                    cli.write("Firewall_Rules_"+lastindex+ "_DstIPStart", remoteIP);
                    cli.write("Firewall_Rules_"+lastindex+ "_OutputExt", 1);
                    cli.write("Firewall_Rules_"+lastindex+ "_Output", data.ICS);
                } else {
                    cli.write("Firewall_Rules_"+lastindex+ "_SrcPorts", remotePort);
                    cli.write("Firewall_Rules_"+lastindex+ "_DstPorts", localPort);
                    cli.write("Firewall_Rules_"+lastindex+ "_SrcIPStart", remoteIP);
                    cli.write("Firewall_Rules_"+lastindex+ "_DstIPStart", localIP);
                    cli.write("Firewall_Rules_"+lastindex+ "_InputExt", 1);
                    cli.write("Firewall_Rules_"+lastindex+ "_Input", data.ICS);
                }
                if ($("#Action").val() == "rjctLocal") {
                    cli.write("Firewall_Rules_"+lastindex+ "_Target", 'RejectPort');
                } else if ( $("#Action").val() == "rjctRemote" ) {
                    cli.write("Firewall_Rules_"+lastindex+ "_Target", 'Drop');
                }
                else  {
                    cli.write("Firewall_Rules_"+lastindex+ "_Target", 'Accept');
                }

                cli.commit(function(res) {
                    if(res.error) {
                        Messages.error(res.error);
                        lastindex -- ;
                    }   else {
                        Messages.info('Regra de redirecionamento de porta adicionada com sucesso.');
                        var tab = document.getElementById('rulesListBody').getElementsByTagName('tr');
                        var l = tab.length
                        $("#rulesListBody").append((tab[l -1].innerHTML));
                        tab[l -1].outerHTML ='<tr id="rules'+lastindex+'"><td>'+$("#ruleName").val()+'</td><td>'+$("#protocol").val()+'</td>\
                            <td>'+$("#localPort").val()+'</td><td>'+$("#localIP").val()+'</td>\
                            <td><img src="../../img/'+$("#Action").val()+'.png"></td>\
                            <td>'+$("#remoteIP").val()+'</td><td>'+$("#remotePort").val()+'</td>\
                            <td class="actions"><img width="20px" onclick="Page.edit(\''+lastindex+'\');" alt="Edit" src="../../img/edit.png" style="cursor:pointer">\
                                <img width="20px" onclick="Page.remove(\''+lastindex+'\');" alt="Delete" src="../../img/delete.png" style="cursor:pointer">\
                                <img onclick="Page.up(\''+lastindex+'\');" alt="Up" src="../../img/arrow_up.png"  style="cursor:pointer; padding-bottom:6px"> \
                                <img onclick="Page.down(\''+lastindex+'\');" alt="Down" src="../../img/arrow_down.png"  style="cursor:pointer; padding-bottom:6px"> \
                            </td></tr>'
                        clearRule();
                    }
                });
            }   
        });
    }
    
    return {
        init: function(pageData) {
            data = pageData;
            cli = ConfigAccess(data.token);
            
            initUI();
        },
        setDefault: function(value){
            changeDefaultPolicy(value);
        },
        remove: function(index){
            removeRule(index);
        },
        edit: function(index){
            editRule(index);
        },
        save: function(index){
            saveRule(index);
        },
        cancel: function(index){
            cancelRule(index);
        },
        up: function(index){
            changePriorityRule(index,1);
        },
        down: function(index){
            changePriorityRule(index,0);
        }
    };    
})(lite, App);