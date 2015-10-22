var FirewallService = (function($) {
    var pfx_rules = "Firewall_Rules"; 
    
    // get a new index for Firewall_Rules
    function getToken(cli) {
        var cliData = cli.getData().split("&");
        return cliData[0].split("=")[1];
                
    }
    function getNewFwRulesIndex(cli) {
        var rules_list;
        var res;
        var idx_rules;
        var token = getToken(cli);        
        if (token == undefined) return -1;
        var cli2 = ConfigAccess(token);
        cli2.read(pfx_rules + "_List");        
        res = cli2.commitSync(res);
        if (res.error != undefined) return -1;
        rules_list = res.Firewall_Rules_List.split(",");
        
        // we look for index that not had already been registered in cli, but that will be in this cli request        
        var reg = /write=Firewall_Rules_([0-9]+)_Enable/g;
        var data_ex = cli.getData();
         do {
            match = reg.exec(data_ex);
            if (match != null) rules_list[rules_list.length -1 ] = match[1]; 
         } while (match != null);
        
        idx_rules = parseInt(rules_list[rules_list.length - 1]);
        idx_rules = (idx_rules < 1001) ? 1001 : idx_rules + 1; 
        return idx_rules;
           
    }
    
    function writeFwRules(cli, idx_rules, obj) {
        var pfx_obj = pfx_rules + "_"+ idx_rules;
        $.util.forEach(obj, function (prm_value,prm_name) {
            cli.write(pfx_obj + "_" + prm_name, prm_value);                
        });
    }
        
    function cli_error(res) {
       if (res.error != undefined) {
        console.log(" addRules " + obj.Description + "Error: " + res.error);
        cli.rollback();
        return -1;
        }         
    }    
    return {
        /*
         *  obj must have the followings value :
         *  obj {
         *      Descpription
         *      DstIpAddress
         *      RemotePort
         *      SrcPort
         *      Proto,
         *  };
         *  Note: addRule retrieves Firewall_Rules.List using cli. So don't add any value be
         *       
        */
        addRules: function(cli, obj, doCommit) {
            var idx_rules = getNewFwRulesIndex(cli, 0);
            if (idx_rules < 1) return -1;
            writeFwRules(cli, idx_rules, obj);
            if (doCommit == undefined || !doCommit) return
            cli.commit(cli_error);
            cli.rollback();
            console.log("Adding Rules" + idx_rules + " for" + obj.Description); 
            return    
        },
        updateRules: function(cli, idx_rules, obj, doCommit) {
            writeFwRules(cli, idx_rules, obj);
            if (doCommit == undefined || !doCommit) return      
            cli.commit(cli_error);
            cli.rollback();
            console.log("Updating Rules" + idx_rules + " for" + obj.Description);             
        },
        updateRulesWithDesc : function (cli, obj, doCommit) {
            var token = getToken(cli);
            var cli2 = ConfigAccess(token);
            var req = "Firewall_Rules_*[Description=" + obj.Description + "]";
            var res = cli2.read(req).commitSync();
            if (res.error == undefined) {
                var idx_list = res[req].List.split(",");
                for (var idx = 0; idx < idx_list.length; idx++) {
                    writeFwRules(cli, idx_list[idx], obj);
                }
                if (doCommit == undefined || !doCommit) return      
                cli.commit(cli_error);
                cli.rollback();
            }
        },
        delRulesWithIndex: function(cli, idx_rules, doCommit) {
            cli.remove(pfx_rules + "_" + idx_rules);
            if (doCommit == undefined || !doCommit) return      
            cli.commit(cli_error);
            cli.rollback();
            
        },
        delRulesWithDesc: function (cli, description, doCommit) {
            var req = "Firewall_Rules_*[Description=" + description + "]";
            var res = cli.read(req).commitSync();
            if (res.error == undefined) {
                var idx_list = res[req].List.split(",");
                for (var idx = 0; idx < idx_list.length; idx++) {
                    //console.log("Remove " + "Firewall_Rules_" + idx_list[idx]);
                    cli.remove("Firewall_Rules_" + idx_list[idx]);
                }
            if (doCommit == undefined || !doCommit) return      
            cli.commit(cli_error);
            cli.rollback();
           }
        },
    };
})(lite);