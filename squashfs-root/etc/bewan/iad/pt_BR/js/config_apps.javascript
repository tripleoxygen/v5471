var Page = (function($, App, AppList) {
    var util = $.util, data, 
    
        // UI controls
        Messages = App.MessageUtil,
        mappingTable,
        applicationListUi,
        ipAddressUi,

        // Port mapping service
        service, 
        
        // table action buttons template
        actionHtml = [
            '<div class="actions">',
                // '<a class="action small save hidden">Save</a> ',
                '<a class="delete"><img src="../../img/delete.png" width="16px" alt="Delete" /></a> ',
            '</div>'
        ].join('');
    
    function getPortMappingsTableData(mappings) {
        var apps = {}, rows = [];
        util.forEach(mappings, function(m) {
            var name = m.Description;
            if(!apps[name] && m.Type == 'app' ) {
                rows[rows.length] = [name, m.InternalClient, m];
                apps[name] = name;
            }
        });
        
        return rows;
    }
    
    function getPortMappings(appName) {
        var app = AppList.findApplication(appName), portMappings = [];
        if(app) {
            util.forEach(app.protocols, function(ports, protocol) {
                portMappings.push({
                    Enable: 1,
                    PortSurjection: 1,
                    ExternalPort: ports,
                    Protocol: protocol,
                    Description: app.name,
                    Type:"app"
                });
            });
        }
        return portMappings;
    }
    
    
    function initializeApplicationList() {
        var categories = ApplicationList.getCategories(), options = [];
        options.push('<option value=""></option>');
        util.forEach(categories, function(cat) {
            options.push('<optgroup label="' + cat.label + '">');

            var apps = ApplicationList.getApps(cat.name);
            util.forEach(apps, function(app) {
                var name = app.name;
                options.push('<option value="' + name + '">' + name + '</option>');
            });
            options.push("</optgroup>")
        });         
        applicationListUi.prepend(options.join(""));
        applicationListUi.val("_none_");
    }
    
    function resetForm() {
        applicationListUi.val("");
        ipAddressUi.val("");
    }
    
    function indexOfRow(smapping) {
        return mappingTable.indexOf(smapping, function(currRowData, searchMapping) {
            return searchMapping.Description == currRowData[0];
        });
    }

    function populateHosts() {
        var opts = [];
        opts[opts.length] = ['<option value="" ></option>'].join('');
        util.forEach(data.lanHosts, function(host, idx) {
            if(idx === "Count") {
                return;
            }
            opts[opts.length] = ['<option value="', host.IPAddress, '">', (host.Hostname || host.IPAddress), '</option>'].join('');
            //arrLanHostIp[arrLanHostIp.length] = host.IPAddress;
        });
        $("#lanHosts").prepend(opts.join(''));
    }
        
    function initUI() {
        applicationListUi = $("#applicationList"),
        ipAddressUi = $("#lanHosts");
            
        initializeApplicationList();
        populateHosts();

         mappingTable = $.Table("#mappingTable", {
            data: getPortMappingsTableData(service.getPortMappings()),
            renderer: function(options) { // how each cell is rendered
               var td = $(options.td), 
                  tr = $(options.tr),
                  rowData = options.rowData,
                  cellData = options.cellData, 
                  colIndex = options.colIndex,
                  mapping = rowData[2],
                  
                  actions,
                  actDel;
                  
               if(colIndex === 0) {
                   tr.attr("id", "app_" + mapping._index);
               }
                  
               // Add a handler to delete row in the last cell
               if(colIndex === 2) {
                  td.html(actionHtml);
                  actions = td.find("div.actions");
                  // actEdit = actions.find("a.edit");
                  // actSave = actions.find("a.save");
                  actDel = actions.find("a.delete");
                  actDel.bind("click", function() {
                      var mappings = getPortMappings(mapping.Description), names = [], rowIdxToRemove = {};
                      
                      util.forEach(mappings, function(m) {
                          names[names.length] = service.getCanonicalName(m);
                          rowIdxToRemove[mapping.Description] = indexOfRow(m);
                      });
                      
                      // console.log(JSON.stringify(rowIdxToRemove));
                      Messages.clearAll();
                      service.removePortMappingByName(names, function(res) {
                          if(res.error) {
                              Messages.error(res.error);
                          }else {
                              util.forEach(rowIdxToRemove, function(i, desc) {
                                  mappingTable.removeRow(i);
                              });
                              Messages.info('Regra de redirecionamento de porta de apagada com sucesso.');
                          }
                      });
                  });
                  
               }else {
                  td.html(cellData);
               }
            }
         });

         $("#cancel").bind("click", function() {
            applicationListUi.selected(0);
            ipAddressUi.selected(0);
        });
         
         $("#addRule").bind("click", function() {
             Messages.clearAll();
             
            var app = applicationListUi.val(), ip = ipAddressUi.val(), mappings;
            if (app =='' ) {
                Messages.error('Por favor informe um jogo/aplicativo na lista antes de salvar.');
                return;
            }
            if (ip =='') {
                Messages.error('Por favor informe um dispositivo na lista antes de salvar.');
                return;
            }
                                
            if(app) {
                mappings = getPortMappings(app);
                util.forEach(mappings, function(m) {
                    m.InternalClient = ip;
                });
                service.addPortMapping(mappings, function(res, addedMappings) {
                    if(res.error) {
                        Messages.error(res.error);
                        return;
                    }
                    
                    Messages.info('Regra de redirecionamento de porta adicionada com sucesso.');
                    
                    var rows = getPortMappingsTableData(addedMappings);
                    util.forEach(rows, function(row) {
                        var mapping = row[2], idx = indexOfRow(mapping), uiRow;

                        if(idx !== -1) { // an existing mapping was updated
                            mappingTable.updateRow(row, idx);
                        }else { // a new mapping was added
                            mappingTable.addRow(row);
                            idx = mappingTable.rowCount() - 1;
                        }
                        uiRow = mappingTable.$.find("tbody").children("tr")[idx];
                        $.Highlight(uiRow);
                    });
                    resetForm();
                });
            }
             
         });
    }
    
    return {
        init: function(pageData) {
            data = pageData;
            service = PortMappingService(data.token, data.defaultConService, data.wanPortMapping);
            
            initUI();
        }
    };
})(lite, App, ApplicationList);


