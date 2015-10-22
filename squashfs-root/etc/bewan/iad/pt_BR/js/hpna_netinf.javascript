"use strict";
var PerfDiag = (function ($) {
    var util = $.util;
    var Message;
    var token = "";
    var update = {};
    var DIAG_CHECK = 5;
    var do_perfdiag_check = DIAG_CHECK;
    var do_stationdiag_check = DIAG_CHECK;
    var popup = undefined;
    
    var netinf_state_enum = {
        NOTDONE: 0,
        COMPUTING: 1,
        DONE: 2,
        ERROR: 3
    };
    var netinf_test_done = netinf_state_enum.NOTDONE;
    
    /* Pattern to check fields */
    var float_type = {
        type: "pattern",
        pattern: /^([+-]{1})*[0-9]+([\.[0-9]+)*$/,
        message: 'Você precisa informar um valor do tipo float para este campo.'
            };
    var int_type = {
        type: "number",
        message: 'Você precisa informar um valor do tipo inteiro para este campo.'
    };
    var vRules = {
        PerfDiag: {
            MaxPer: [float_type],
            MinRxPower: [float_type],
            MinRate: [float_type],
            NumberOfPacket: [int_type]
        },
        NetPerDiag: {
            Period: [int_type],
            TestTime: [int_type]
        }
    };
    
    var vRender = {
        render: function (objmsg) {
            if (objmsg.length == 0) {
                errMsg('Mensagem de erro desconhecida.');
            } else {
                util.forEach(objmsg, function (msg) {
                    errMsg(msg.message);
                    $("#" + msg.id).addClass("invalid");
                });
            }
        },
        clear: function () {
            $(".invalid").removeClass("invalid");
            Message.clearAll();
        }
    };
    
    var token;
    var cli;
    var validator = { perfDiag: {}, netPerDiag: {}};
    var hpna = {};
    var cli = {};
    
    function infoMsg(str) {
        Message.clearAll();
        Message.info(str);
    }
    function errMsg(str) {
        Message.clearAll();
        Message.error(str);
    }
    function warnMsg(str) {
        Message.clearAll();
        Message.warn(str);
    }
    
    function dbg(str) {}
    
    /* Bind settings section*/
    function loadSettings(ui_selector, data_objs, valid_obj) {
        /* fill HPNA Netinf Settings parameters and bind needed events */
        lite.util.forEach($(ui_selector).elements, function (param) {
            var val = data_objs[param.id] == "" ? data_objs["Default" + param.id] : data_objs[param.id];
            if (param.name == "TestTime") {
                $("#" + param.id).val(val/60);
            } else {
                $("#" + param.id).val(val);
            }
            $("#" + param.id).bind("change", function () {
                /* When settings parameters change, we check their validity*/
                var ret = valid_obj.validateAll();
                /*
                if (ret) {
                    data_objs[this.id] = $("#" + this.id).val();
                }
                */
                return ret;
            });
        });
    }
    
    /* fill results section */
    function fillPerfDiagSection(mac) {
        var station = (netinf_but_action.action_type == "show_results") ? hpna.PerfDiag.StationSaved : hpna.PerfDiag.Station;
        lite.util.forEach(station, function (elm) {
            if (mac == elm.DstMacAddress) {
                lite.util.forEach(["PktsTx", "Per", "Rate", "RxPower", "SrcMacAddress", "DstMacAddress"], function (param) {
                    if (/MacAddress$/.test(param))
                        // write mac like (<Rx|Tx>, <5 last string of mac>)
                        $("#res_" + param).html("(" + ((param.substr(0,3) == "Dst") ? "Rx" : "Tx") + elm[param].substr(12) + ")");
                    else
                        $("#res_" + param).html(elm[param]);
                });
            }
        });
    }
    function fillPerfDiagSectionClear() {
        lite.util.forEach(["PktsTx", "Per", "Rate", "RxPower", "SrcMacAddress", "DstMacAddress"], function (param) {
            $("#res_" + param).html("");
        });
    }
    function fillStationResult(idx) {
        fillPerfDiagSection(hpna.StationDiag.Station[idx].MacAddress);
    }
    
    function fillStationList(use_saved) {
        var html_tab = [];
        var first = 1;
        var is_selected = 'selected="selected"';
        var macs;
        var Station = hpna.StationDiag.Station;
        
        if (use_saved == 1) Station = hpna.StationDiag.StationSaved;
        // fill the UI select with list of stations
        lite.util.forEach(Station, function (station, station_id) {
            if (station_id == "Count") return;
            /* we set the station_list selected index to the firt element */
            if (html_tab.length != 0) {
                is_selected = "";
            }
            macs = station.MacAddress;
            html_tab.push('<option value="'+ station_id + '" ' +  is_selected + '>' + macs + '</option>');
        });
        $("#station_list").html(html_tab.join("\n"));
        return html_tab.length;
    }
    
    function updateStationSelectedItem () {
        // get the selected index
        var idx = $("#station_list").elements[0].selectedIndex;
        // get the index in hpna
        var data_idx = $("#station_list").elements[0].options[idx].value;
        fillStationResult(data_idx);
    }
    
    function loadMonitor() {
        lite.util.forEach($("#menu-monitor .monitor_status").elements, function (param) {
            $("#" + param.id).html(hpna.CurrentInstance[param.id]);
        });
        if (hpna.CurrentInstance.Status  == "2") {
            $("#hpna_status").addClass("hpna_status_on");
            $("#hpna_status strong").html('HPNA - Pronto');
        } else {
            $("#hpna_status").removeClass("hpna_status_on");
            $("#hpna_status strong").html('HPNA - Não disponível');
        }

        if (fillStationList() > 0) $("#station_list").bind("change", updateStationSelectedItem);
    }
    
    function commit_error(xhr, code, message) {
        $(".busy").removeClass("show");
        var info = warnMsg('Erro ao salvar configurações.');
        console.log(message);
    }
    
    function commit_succeed(res) {
        $(".busy").removeClass("show");
        if (res.error != undefined) {
            errMsg(res.error);
            console.log(res.error);
            return false;
            // TODO: fade of message

        } else {
            infoMsg('Configurações salvas com sucesso.');
        }
        return true;
    }
    
    function updateStationDiagStatus() {
        cli.rollback();
        cli.read("HPNA_StationDiag");
        cli.read("HPNA_CurrentInstance");
        $(".busy").addClass("show");
        cli.commit(updateStationDiag_check, commit_error);
    }

    function updateStationDiag_check(res) {
        $(".busy").removeClass("show");
        if (res != undefined) {
            if (res.error != undefined) {
                console.log("Error received : ", res.error);
                errMsg(res.error);
                return;
            }
            if (res.HPNA_CurrentInstance != undefined) {
                hpna.CurrentInstance = res.HPNA_CurrentInstance;
               loadMonitor();
            }
            if (res.HPNA_StationDiag != undefined) {
                hpna.StationDiag = res.HPNA_StationDiag;
                fillStationList();
            }
        }
    }
    
    function updatePerfDiagStatus() {
        cli.rollback();
        cli.read("HPNA_PerfDiag");
        cli.read("HPNA_CurrentInstance");
        $(".busy").addClass("show");
        cli.commit(updatePerfDiag_check, commit_error);
    }
    
    function netinfStationToHtml(station) {
        var html_data = "";
        var fld_list = [{
             src_data: "DstMacAddress",
             title: 'Dispositivo de Destino:',
            }, {
             src_data: "PktsTx",
             title: 'Pacotes'
            }, {
             src_data: "Per",
             title: 'PER'
            }, {
             src_data: "Rate",
            title: 'Taxa'
            }, {
             src_data: "RxPower",
             title:'Potência '
            }];
        
        var fld;
        var mac = (station["SrcMacAddress"].length == 5) ? station["SrcMacAddress"]: station["SrcMacAddress"].substr(12);
        html_data += '<tr><td colspan=2>Source Device:(Tx,' + mac + ')</td></tr>';
        var res = (station.Success == undefined && station.TestStatus == "1") ? 'Aprovado' : 'Falhou';
        var res_css = (station.Success == undefined && station.TestStatus == "1") ? "success" : "failed";
        html_data += '<tr><td class="cinza text-left">Resultado</td><td class="cinza text-left ' + res_css + '">' + res + '</td></tr>';
        
        for (fld in fld_list) {
            html_data += "<tr>";   
            html_data += '<td class="cinza text-left">' + fld_list[fld].title + '</td>';
            if(fld_list[fld].src_data == "DstMacAddress") {
                mac = (station[fld_list[fld].src_data].length == 5) ? station[fld_list[fld].src_data] : station[fld_list[fld].src_data].substr(12);
                html_data += '<td class="cinza text-data">(Rx,' + mac + ')</td>';
            } else
                html_data += '<td class="cinza text-data">' + station[fld_list[fld].src_data] + '</td>';
            html_data += "</tr>";
        }
        return html_data;
    }

    function getNetinfResultsFromMacs(src_mac, dst_mac) {
        var station_idx;
        var stationList = hpna.PerfDiag.Station;
        for (station_idx in stationList) {
            if (station_idx == "Count") continue;
            if ((src_mac != stationList[station_idx].SrcMacAddress.substr(12)) ||
                (dst_mac != stationList[station_idx].DstMacAddress.substr(12))) continue;
            return stationList[station_idx];
        }
        return {
            "SrcMacAddress": src_mac,
            "DstMacAddress": dst_mac,
            "PktsTx": 0,
            "Per": 0,
            "Rate": 0,
            "RxPower": 0,
            "Success" : 0,
        };
    }
    
    function fillNetInfDetails(sum_tab) {
        var html_data = "",x,y,station;
        for (y = 1; y < sum_tab.length; y++) {
            for (x = 1; x < sum_tab.length; x++) {
                if (x == y) {
                    sum_tab[x][y] = "";
                    continue;
                }
                station = getNetinfResultsFromMacs(sum_tab[0][y], sum_tab[x][0]);
                html_data += netinfStationToHtml(station);
            }
        }
        $("#netinf_details tbody").html(html_data);
    }
    function fillNetInfDetails2(sum_tab) {
        var html_data = "",x,y;
        if (hpna.PerfDiag.Station.Count == 0) {
            /* no station found so we will display a bad res*/
            for (x = 1; x < sum_tab.length; x++) {
                for (y = 1; y < sum_tab.length; y++) {
                    if (x == y) {
                        sum_tab[x][y] = "";
                        continue;
                    }
                    var _station = {
                        "SrcMacAddress": sum_tab[0][y],
                        "DstMacAddress": sum_tab[x][0],
                         "PktsTx": 0,
                        "Per": 0,
                        "Rate": 0,
                        "RxPower": 0,
                        "Success" : 0,
                    };
                    html_data += netinfStationToHtml(_station);
                }
            }
            console.log("Fake Station");
        } else {
            lite.util.forEach(hpna.PerfDiag.Station, function (station, station_id) {
                if (station_id == "Count") return;
                    html_data += netinfStationToHtml(station);
            });
        }
        $("#netinf_details tbody").html(html_data);
    }
 
    function isNetInfDoneOn(src_end_mac, dst_end_mac) {
            var found = 0;
            lite.util.forEach(hpna.PerfDiag.Station, function (station, station_id) {
            if (station_id == "Count") return;
            if (src_end_mac == station.SrcMacAddress.substr(12) &&
                dst_end_mac == station.DstMacAddress.substr(12)
               )
               found = station.TestStatus == "1" ? 1 : 0;
               // this break the loop
               return {};
            });
            return found;
    }    
    
    function fillNetInfSum() {
        var sum_tab = [[""]], x, y;
        lite.util.forEach(hpna.StationDiag.Station, function (station, station_id) {
            if (station_id == "Count") return;
            // add header 
            sum_tab[0].push(station.MacAddress.substr(12));
            // add line
            sum_tab.push([station.MacAddress.substr(12)]); 
        });
        for (x = 1; x < sum_tab.length; x++)
            for (y = 1; y < sum_tab.length; y++) {
                if (x == y) {
                    sum_tab[x][y] = "";
                    continue;
                }
                sum_tab[x][y] = isNetInfDoneOn(sum_tab[0][x], sum_tab[y][0]);
            }
        return sum_tab;
    }
    
    function dpy_netinf_sum() {
        var sum_tab = fillNetInfSum(), x, y;
        var succeed = 1;
        $("#tbl_netinf").setStyle({"visibility": "visible"});
        for (x = 1; succeed && x < sum_tab.length; x++)
            for (y = 1; succeed && y < sum_tab.length; y++) {
                if (x == y) continue;
                if (!sum_tab[x][y]) {
                    succeed = 0;
                    break;
                }
            }
        $("#netinf_results").removeClass("results_failed");
        $("#netinf_results").removeClass("results_success");
        $("#netinf_results").addClass((succeed == 1 ) ? "results_success" : "results_failed");
        $("#netinf_results").html((succeed == 1 ) ? 'TESTE APROVADO' : 'TESTE REPROVADO');
        if (popup != undefined && popup.window != null) {
            display_netinf_popup("Netinf");
        }

        var html_sum_tab  = "<tbody>";
        for (x = 0; x < sum_tab.length; x++) {
            html_sum_tab +="<tr>";
            for (y = 0; y < sum_tab.length; y++) {
                switch (sum_tab[x][y]) {
                    case 1:
                    html_sum_tab += "<td class=\"success\">" + 'Aprovado' + "</td>";
                    // test succeed
                        break;
                    case 0:
                    html_sum_tab += "<td class=\"failed\">" + 'Falhou' + "</td>";
                    // test failed
                        break;
                    case -1:
                    html_sum_tab += "<td class=\"success\">" + "&nbsp" + "</td>";
                    // no test on the same mac
                        break;
                    default:
                     html_sum_tab += "<td class=\"title\">" + sum_tab[x][y] + "</td>";
                    // header
                    
                        break;
                };
            }
            html_sum_tab +="</tr>";
        }
        html_sum_tab +="</tbody>";
        $("#netinf_sum_table").html(html_sum_tab);
        fillNetInfDetails(sum_tab);
    }
    
    function updatePerfDiag_check(res) {
        netinf_test_done = netinf_state_enum.COMPUTING;
        if (res != undefined) {
            if (res.error != undefined) {
                $(".busy").removeClass("show");
                console.log("Error received : ", res.error);
                errMsg(res.error);
                dpy_netinf_sum();
                netinf_test_done = netinf_state_enum.ERROR;
                return;
            }
            console.log("Data received state :" + res.HPNA_PerfDiag.DiagState);
            switch(res.HPNA_PerfDiag.DiagState) {
                case "sync":
                case "ongoing":
                    hpna.PerfDiag = res.HPNA_PerfDiag;
                    if (res.HPNA_PerfDiag.Count > 0) fillStationList();
                    setTimeout(updatePerfDiagStatus, 2000);
                break;
                case "done":
                    if (res.HPNA_PerfDiag.Station.Count == 0 && do_perfdiag_check) {
                        console.log("Retrying");
                        netinf_test_done = netinf_state_enum.COMPUTING;
                        setTimeout(updatePerfDiagStatus, 2000);
                        do_perfdiag_check--;
                        return;
                    }
                    $(".busy").removeClass("show");
                    dpy_netinf_sum();
                    hpna.PerfDiag = res.HPNA_PerfDiag;
                    console.log("Data received state :" + res.HPNA_PerfDiag.Station.Count);
                    netinf_test_done = netinf_state_enum.DONE;
                    if (res.HPNA_PerfDiag.Station.Count > 0) {
                        var idx = $("#station_list").elements[0].selectedIndex;
                        // get the index in hpna
                        var data_idx = $("#station_list").elements[0].options[idx].value;
                        fillStationResult(data_idx);
                        infoMsg('<strong >Sincronizado: Todos os dados recebidos.</strong>');
                    }
                    
                break;
                case "error":
                    $(".busy").removeClass("show");
                    errMsg('Erro ao sincronizar dispositivos HPNA.. Certifique-se de que o Power Box está conectado a outro dispositivo HPNA.');
                break;
            };
        }
    }
    
    function fillNetPerTable(tbl) {
        var sum = {
            Time: 0,
            Tx: 0,
            Rx: 0,
            Crc: 0,
            Dropped: 0,
            Lost: 0
        };
        var out = [];
        var old_value = -1;
        
        $("#table_results tbody").remove("tr");
        $("#table_results_sum tbody").remove("tr");
        util.forEach(tbl, function (item, key) {
            if (key == "Count") return;
            if (key == "List") return;
            var elm = [];
            var param;
            util.forEach([ "Time", "Tx", "Rx", "Crc", "Dropped", "Lost", "Per", "Idle" ], function (value, key) {
                if (value == "Time") {
                    if (old_value == -1) {
                        old_value = item[value];
                        elm.push("0");
                    } else {
                        elm.push(item[value] - old_value);
                       // old_value = item[value];
                       sum[value] = parseInt(item[value]) - parseInt(old_value);
                    }
                } else {
                    if (sum[value] != undefined) sum[value] = parseInt(sum[value]) + parseInt(item[value]);
                    elm.push(item[value]);
                }
            });
            out.push(elm);
        });
        var table_sum = [
            sum.Time,
            sum.Tx,
            sum.Rx,
            sum.Crc,
            sum.Dropped,
            sum.Lost,
        ];
        
        
        $.Table("#table_results", {}).addRows(out);
        $.Table("#table_results_sum", {}).addRow(table_sum);
        
    }
    
    function updateNetPerDiagStatus() {
        cli.rollback();
        cli.read("HPNA_NetPerDiag");
        $(".busy").addClass("show");
        cli.commit(updateNetPerDiag_check, commit_error);
    }
    
    function updateNetPerDiag_check(res) {
        if (res != undefined) {
            if (res.error != undefined) {
                $(".busy").removeClass("show");
                console.log("Error received : ", res.error);
                errMsg(res.error);
                return;
            }
            console.log("Data received state :" + res.HPNA_NetPerDiag.DiagState);
            switch(res.HPNA_NetPerDiag.DiagState) {
                case "sync":
                case "ongoing":
                    hpna.NetPerDiag = res.HPNA_NetPerDiag;
                    if (res.HPNA_NetPerDiag.Table.Count > 0) fillNetPerTable(hpna.NetPerDiag.Table);
                    setTimeout(updateNetPerDiagStatus, 2000);
                break;
                case "done":
                    $(".busy").removeClass("show");
                    if (res.HPNA_NetPerDiag.Table.Count == 0 && do_perfdiag_check) {
                        console.log("Retrying");
                        setTimeout(updateNetPerDiagStatus, 2000);
                        do_perfdiag_check--;
                        break;
                    }
                    console.dir(res);
                    hpna.NetPerDiag = res.HPNA_NetPerDiag;
                    console.log("Data received state :" + res.HPNA_NetPerDiag.Table.Count);
                    if (res.HPNA_NetPerDiag.Table.Count > 0) {
                        fillNetPerTable(hpna.NetPerDiag.Table);
                    }
                    infoMsg('<strong >Monitor: Todos os dados recebidos.</strong>');
                break;
                case "error":
                    $(".busy").removeClass("show");
                    errMsg('Erro ao sincronizar dispositivos HPNA.. <br/>Certifique-se de que o Power Box está conectado a outro dispositivo HPNA.');
                break;
            };
        }
    }

    
    function settings_save(section_id, valid, confg_prefix) {
        if (!valid.validateAll()) return false;
        cli.rollback();
        lite.util.forEach($("#" + section_id + " .settings").elements, function (param) {
            var value = param.value;
            if (param.name == "TestTime") {
                value *= 60;
            }
            cli.write(confg_prefix + "_" + param.id, value);
        });
        $(".busy").addClass("show");
        cli.commit(commit_succeed, commit_error);
        return true;
    }
    
    function settings_cancel(section_id, valid, data_obj) {
        lite.util.forEach($("#" + section_id + " .settings").elements, function (param) {
            var val = data_obj[param.id] == "" ? data_obj["Default" + param.id] : data_obj[param.id];
            $("#" + param.id).val(val);
        });
        validator.perfDiag.clear();

    }

    function display_netinf_popup(source) {
       popup = window.open('', source, 'height=500,width=700');
       var doc = popup.document;
       doc.body.innerHTML = "";
       doc.write('<html><head><title>NetInf</title>');
       doc.write('<link rel="stylesheet" href="../../css/gateway.css" />');
       doc.write('<body class="popup"> <center>');
       doc.write('<H1>NetInf</H1>');
       doc.write('<H2>Summary Table</H2>');
       doc.write('<table class="popup" id="tbl_netinf2">');
       doc.write($("#tbl_netinf").html());
       doc.write('</table></center></body></html>');

    }
    function display_netper_popup(source) {
       if (typeof(popup) != "undefined") popup.document.close();
       popup = window.open('', source, 'height=500,width=700');
       var doc = popup.document;
       doc.write('<html><head><title>NetPer </title>');
       doc.write('<link rel="stylesheet" href="../../css/gateway.css" />');
       doc.write('<body class="popup">');
       doc.write('<H1>NetPer </H1>');
       doc.write('<br/>' + Date() + '<br/><br/>');
       doc.write('<center>');
       doc.write('<table id="table_results_sum2">');
       doc.write($("#table_results_sum").html());
       doc.write('</table><br/><br/>');
       doc.write('<table id="table_results_2">');
       doc.write($("#table_results").html());
       
       doc.write('</table></center></body></html>');
    }
    function clear(config_prefix, config_obj) {
        cli.rollback();
        util.forEach(config_obj, function(value, key) {
            cli.remove(config_prefix + "_" + key);
        });
        $(".busy").addClass("show");
        cli.commit(function (res) {
            $(".busy").removeClass("show");
            if (commit_succeed(res)) {
                util.forEach(config_obj, function(value, key) {
                    if (key == "List") 
                        config_obj.List = "";
                    else
                        delete config_obj[key]; 
                });
            }
        }, commit_error);
    }
    
    var netinf_but_action = {
        action_type: "",
        settings_save: function () {
            settings_save("tab-02", validator.perfDiag, "HPNA_PerfDiag_Settings");
            return true;
        },
        settings_cancel: function () {
            console.log("cancel fired !!");
            settings_cancel("tab-02", validator.perfDiag, hpna.PerfDiag.Settings);
        },
        refresh: function () {
            console.log("refresh fired !!");
            if (!validator.perfDiag.validateAll()) {
                warnMsg('Por favor, valide a configuração.');
                return false;
            }
            do_stationdiag_check = DIAG_CHECK;
            hpna.StationDiag.Station = {};
            fillStationList();
            updateStationDiagStatus();
            return true;
        },
        show_results: function () {
            console.log("show_results fired !!");
            if (hpna.PerfDiag.StationSaved.List != "") {
                var idx = $("#station_list").elements[0].selectedIndex;
                // get the index in hpna
                var data_idx = $("#station_list").elements[0].options[idx].value;
                fillStationResult(data_idx);
            }
        },
        cmd: function () {
            if (netinf_test_done == netinf_state_enum.COMPUTING) {
                return;
            }
            netinf_but_action.clear();
            do_perfdiag_check = DIAG_CHECK;
            console.log("netinf_cmd fired !!");
            if (hpna.CurrentInstance.Status != 2 || hpna.StationDiag.Station.Count < 2) {
                errMsg('Certifique-se de que o Power Box está conectado a outro dispositivo HPNA.' + "<br/>" + 'Clique em ATUALIZAR para renovar a lista de dispositivos.');
                return;
            }
            cli.rollback();
            cli.write("HPNA_PerfDiag_DiagState", "sync");
            $(".busy").addClass("show");
            $("#netinf_results").removeClass("results_failed");
            $("#netinf_results").removeClass("results_success");
            netinf_test_done = netinf_state_enum.COMPUTING;
            cli.commit(updatePerfDiagStatus, commit_error);
        },
        save_results: function () {
            if (netinf_test_done == netinf_state_enum.COMPUTING) {
                infoMsg('Atenção:  Teste em andamento. Por favor, aguarde ...');
                return;
            } else if (netinf_test_done == netinf_state_enum.NOTDONE) {
                infoMsg('Atenção: Você precisa executar um teste antes de salvar os resultados.');
                return;
            }
            dpy_netinf_sum();
            display_netinf_popup("Netinf");
        },
        clear: function () {
            $("#tbl_netinf").setStyle({"visibility": "hidden"});
            netinf_test_done = netinf_state_enum.NOTDONE;
            hpna.PerfDiag.StationSaved = [];
            hpna.PerfDiag.Station = [];
            fillPerfDiagSectionClear();
            $("#netinf_results").removeClass("results_failed");
            $("#netinf_results").removeClass("results_success");
            $("#netinf_results").html('');
            $("#netinf_details tbody").html('');
            $("#netinf_sum_table").html('');
            if (typeof(popup) != "undefined") {
               popup.document.close();
               popup = undefined;
           }
        }
    }
    var netper_but_action = {
        action_type: "",
        settings_save: function () {
            settings_save("tab-03", validator.netPerDiag, "HPNA_NetPerDiag_Settings");
            return true;
        },
        settings_cancel: function () {
            console.log("cancel fired !!");
            settings_cancel("tab-03", validator.netPerDiag, hpna.NetPerDiag.Settings);
        },
        start_monitor: function () {
            do_perfdiag_check = DIAG_CHECK;
            hpna.NetPerDiag.Table = {};
            $("#table_results tbody").remove("tr");
            $("#table_results_sum tbody").remove("tr");
            
            console.log("netinf_cmd fired !!");
            cli.rollback();
            util.forEach(hpna.NetPerDiag.Table, function(value, key) {
                if (key == "List") return;
                cli.remove("HPNA_NetPerDiag_Table_" + key);
            });
            cli.write("HPNA_NetPerDiag_DiagState", "sync");
            $(".busy").addClass("show");
            cli.commit(updateNetPerDiagStatus, commit_error);
        },
        save_results: function () {
            console.log("save results fired !!");
            display_netper_popup();
        },
        clear_table: function () {
            $("#table_results tbody").remove("tr");
            $("#table_results_sum tbody").remove("tr");
        },
        load_results : function () {
            if (hpna.NetPerDiag.TableSaved.List != undefined && hpna.NetPerDiag.TableSaved.List != "") fillNetPerTable(hpna.NetPerDiag.TableSaved);
        }
    }

    function loadSectionsButtons(section_id, obj_act) {
        $("#" + section_id + " .btn-default-orange-small").bind("click", function(){
            obj_act.action_type = this.rel;
            obj_act[this.rel]();
        });
    }
    
    function initUI(hpna) {
        loadSettings("#tab-02 .settings", hpna.PerfDiag.Settings, validator.perfDiag);
        loadSettings("#tab-03 .settings", hpna.NetPerDiag.Settings, validator.netPerDiag);
        
        loadSectionsButtons("tab-02", netinf_but_action);
        loadSectionsButtons("tab-03", netper_but_action);
        loadMonitor();

        if (hpna.NetPerDiag.TableSaved.List != undefined && hpna.NetPerDiag.TableSaved.List != "") fillNetPerTable(hpna.NetPerDiag.TableSaved);
    }

    return {
        token: "",
        init: function (data, _token, _Message, _cli) {
            Message = _Message;
            token = _token;
            cli = _cli;
            hpna = data;
            validator.perfDiag = $.validator({rules: vRules.PerfDiag, renderer: vRender});
            validator.netPerDiag = $.validator({rules: vRules.NetPerDiag, renderer: vRender});

            initUI(data);
        },
        updateUI: function (num_interface){
            Message.clearAll();
            switch(num_interface) {
                case "01":
                break;
                case "02":
                    updateStationDiagStatus();
                break;
                case "03":
                    cli.read("HPNA_CurrentInstance").commit(
                        function (res) {
                            if (res.HPNA_CurrentInstance != undefined) {
                               hpna.CurrentInstance = res.HPNA_CurrentInstance;
                               loadMonitor();
                            }
                        }
                    );
                break;
                default: console.log("Unknown interface :" + num_interface);
            }
        }
    };
})(lite);
