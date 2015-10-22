var PortMappingService = (function($) {
    var util = $.util, isTypeOf = util.isTypeOf;
    // services Game & Application and PortMapping doesn't have the PortMapping interpretation, so 
    // we build specific field mapping for each one
    var fld_asss_pm_fw = { 
        "man": {
            "Enable": "Enable",
            "RemoteHost": "SrcIPStart", 
            "InternalClient": "DstIPStart",
            "InternalPort" : "DstPorts",
            
        },
        "app": {
            "Enable": "Enable",
            "InternalClient": "DstIPStart",
            "ExternalPort" : "DstPorts",
        }
    };
    function PmToFwRule(portMapping, fw_desc) {
        var fw_rule = {  
            Input:"1", 
            InputExt:"1", 
            OutputExt: "0", 
            Target:"Accept", 
            Chain: "Forward", 
            User:"1",
        };
        
        util.forEach(portMapping, function (prm_value, prm_name) {
            if (fld_asss_pm_fw[portMapping.Type][prm_name] != undefined) fw_rule[fld_asss_pm_fw[portMapping.Type][prm_name]] = prm_value;
        });
        fw_rule.Description = fw_desc;
        fw_rule.Protos = portMapping.Protocol == "all" ? "tcp,udp" : portMapping.Protocol;
        return fw_rule;
    }
        
    function addPortMappingFwRules(portMapping, cli, fw_desc) {
        var fw_rule = PmToFwRule(portMapping, fw_desc);
        FirewallService.addRules(cli, fw_rule);
    }

    function updatePortMappingFwRules(portMapping, cli, fw_desc) {
        var fw_rules = {
            Enable: 1,
            Description: fw_desc, 
            DstIPStart: portMapping.InternalClient, 
            DstPorts: portMapping.InternalPort, 
            SrcIPStart: portMapping.RemoteHost,
            Protos:portMapping.Protocol == "all" ? "tcp,udp" : portMapping.Protocol,
            Input:"1", 
            InputExt:"1", 
            OutputExt:0, 
            Target:"Accept", 
            Chain: "Forward", 
            User:1,
        };
        FirewallService.updateRulesWithDesc(cli, fw_rules); 
    }
    function delPortMappingFwRules(portMapping, cli, fw_desc) {
        FirewallService.delRulesWithDesc(cli, fw_desc);
    }
    function getCanonicalName(portMapping) {
        return [portMapping.Protocol, portMapping.RemoteHost, portMapping.ExternalPort].join("/");
    }
    function getAndCheckCanonicalName(newMap, portMappings, mappings) {
        var new_can_name = getCanonicalName(newMap);
        for (var id_pm in portMappings) {
            if (new_can_name == id_pm) {
                return portMappings[id_pm];
            }
            // newMap._index == undefined ==> add new rule

            if (newMap._index == undefined) {
                if (newMap.Protocol == "all" || portMappings[id_pm].Protocol == "all") {
                    if (portMappings[id_pm].RemoteHost == newMap.RemoteHost && portMappings[id_pm].ExternalPort == newMap.ExternalPort) {
                        newMap.Protocol = 'all';
                        newMap._index = portMappings[id_pm]._index;
                        return portMappings[id_pm];
                    }
                }
            }
        }
        return undefined;
    }
    function Service(token, wanIdx, initialMappings) {
        var cli = ConfigAccess(token), 
            wanIndex = wanIdx, 
            portMappings = {}, 
            lastIndex = 1000;

        // store mappings keyed in by their canonical name
        function initMappings(mappingObj) {
            var mappingList = mappingObj.List ? mappingObj.List.split(",") : [];
            
            util.forEach(mappingList, function(idx) {
                var mapping = mappingObj[idx], name = getCanonicalName(mapping), index = Number(idx);

                if(lastIndex < index) {
                    lastIndex = index;
                }
                mapping._index = index;
                portMappings[name] = mapping;
            });
            
            console.log("Last index: " + lastIndex);
            //console.log("Initialized with mappings:\n" + JSON.stringify(portMappings, null, " "));
        }
        
        initMappings(initialMappings);

        return {
            containsPortMapping: function(portMapping) {
                return portMappings[getCanonicalName(portMapping)] != null;
            },
            
            addPortMapping: function(portMapping, callback) {
                var i , len, name, mapping, mappings = {}, prefix, existingMapping;

                if(! isTypeOf(portMapping, "Array")) {
                    portMapping = [portMapping];
                }

                // rollback any old dirty data from the cli object
                cli.rollback();

                for(i = 0, len = portMapping.length; i < len; i++) {
                    mapping = portMapping[i];

                    existingMapping = getAndCheckCanonicalName(mapping, portMappings, mappings);
                    if(! existingMapping) {
                        // throw new Error('This port mapping already exists');
                        if (mapping._index == undefined) {
                            // we will add a new PortMapping Rule
                            mapping._index = (++lastIndex);
                            //console.log("Add new PortMapping Rule with index " + mapping._index);
                            addPortMappingFwRules(mapping, cli, "WANConnectionDevice_" + wanIndex + "_PortMapping_" + mapping._index);
                        } else {
                            updatePortMappingFwRules(mapping, cli, "WANConnectionDevice_" + wanIndex + "_PortMapping_" + mapping._index);
                        }
                    }else {
                        console.log("Found existing mapping, update: ");
                        if (mapping._index == undefined) mapping._index = existingMapping._index;
                        updatePortMappingFwRules(mapping, cli, "WANConnectionDevice_" + wanIndex + "_PortMapping_" + mapping._index);
                        // existingMapping.InternalClient = mapping.InternalClient;
                        // mapping = existingMapping;
                    }
                    prefix = "WANConnectionDevice_" + wanIndex + "_PortMapping_" + mapping._index + "_";
                    util.forEach(mapping, function(val, key) {
                        if(key !== "_index") {
                            cli.write(prefix + key, val);
                        }
                    });
                    mappings[name] = mapping;
                }

                // console.log("Commiting data:\n" + JSON.stringify(cli.getData(), null, " "));
                
                cli.commit(function(res) {
                    if(!res.error) {
                        util.forEach(mappings, function(pm, n) {
                            portMappings[n] = pm;
                        });
                        // console.log("Added port mappings:\n" + JSON.stringify(mappings, null, " "));
                    }
                    if(typeof callback === "function") {
                        callback(res, portMapping);
                    }
                });
            },

            removePortMappingByName: function(names, callback) {
                var doCommit = false;
                
                if(! isTypeOf(names, "Array")) {
                    names = [names];
                }
                
                cli.rollback();
                util.forEach(names, function(name) {
                    var m = portMappings[name];
                    if(m) {
                        doCommit = true;
                        cli.remove("WANConnectionDevice_" + wanIndex + "_PortMapping_" + m._index);
                        // remove the associated Fw Rule because, since DefaultPolicy is set to Drop, we have to update Firewall_Rules 
                        delPortMappingFwRules(m,cli, "WANConnectionDevice_" + wanIndex + "_PortMapping_" + m._index);
                    }
                });
                
                if(!doCommit) {
                    console.log("No port mapping rules to remove");
                }
                
                cli.commit(function(res) {
                    if(!res.error) {
                        util.forEach(names, function(nm) {
                            delete portMappings[nm];
                        });
                    }
                    callback(res);
                });
            },
            
            removePortMapping: function(portMapping, callback) {
                var i , len, name, mapping, removes = [], names = [];
                
                if(! isTypeOf(portMapping, "Array")) {
                    portMapping = [portMapping];
                }
                
                // rollback any old dirty data from the cli object
                cli.rollback();
                
                for(i = 0, len = portMapping.length; i < len; i++) {
                    mapping = portMapping[i];
                    name = getCanonicalName(mapping);
                    if((existingMapping = portMappings[name])) {
                        names[names.length] = name;
                        removes.push("WANConnectionDevice_" + wanIndex + "_PortMapping_" + existingMapping._index);
                        delPortMappingFwRules(mapping,cli, "WANConnectionDevice_" + wanIndex + "_PortMapping_" + existingMapping._index);
                    }
                }
                
                if(removes.length) {
                    cli.remove(removes).commit(function(res) {
                        if(!res.error) {
                            util.forEach(names, function(nm) {
                                delete portMappings[nm];
                            });
                        }
                        callback(res);
                    });
                }
            },
            
            getPortMappings: function() {
                var mappings = [];
                util.forEach(portMappings, function(mapping) {
                    mappings[mappings.length] = mapping;
                });
                return mappings;
            },
            
            getCanonicalName: function(portMapping) {
                return getCanonicalName(portMapping);
            },
            
            /**
             * WARNING!! Experimental DO NOT USE. Not tested!!!
             */
            collidesWith: function(targetMapping) {
                var collusionMapping, 
                    targetName = getCanonicalName(targetMapping),
                    targetRhost = targetMapping.RemoteHost,
                    targetPorts = targetMapping.SourcePort;
                    
                util.forEach(portMappings, function(mapping) {
                    // 1. Check for direct canonical name match
                    if(getCanonicalName(mapping) === targetName) {
                        collusionMapping = mapping;
                        return util.Break;
                    }
                    
                    return null;
                });
            }
        };
    }
    
    return Service;
})(lite);