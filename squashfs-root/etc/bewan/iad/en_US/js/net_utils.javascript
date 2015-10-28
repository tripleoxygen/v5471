var Page = (function($, App) {
    var data, cli, utilsTabUi,
    Messages = App.MessageUtil,
    tabIndex = 0,
    tabs = ["iptest", "netinf", "netper"];
    var cli = "";
    function initUI() {/*
        // if a tab is specified select the specified tab.
        var tabStr = location.search.substring(1), idx = tabs.indexOf(tabStr);
        console.log("Tab is: " + tabStr);
        tabIndex = (idx == -1 ? 0 : idx);

        utilsTabUi = $.Tabs("#utilitiesTab", {
            onselect: function(tabElem, index) {},
            selectedIndex: tabIndex
        });
        */
        cli = new ConfigAccess(data.token);
        DiagTestsView.init(data.token);
        if (typeof(PerfDiag) != 'undefined') {
            PerfDiag.init(data.HPNA, data.token, Messages, cli);
        }

        $(".switchButton").bind("click", function() {
            var id = $("#"+this.id);

	        if (id.attr("state") == 0 ) {
	            morpheus(id.elements[0], { duration:300, backgroundPosition: '0px'});
	            id.attr("state", 1);
	        } else {
	            morpheus(id.elements[0], { duration:300, backgroundPosition: '-34px'});
	            id.attr("state", 0);
	        }

        });

        $("#advanced_save").bind("click", function() {
            Messages.clearAll();

            var vc_regex = new RegExp("^([0-9]+/[0-9]+)$");
            if (!vc_regex.test($("#vpivci").val())) {
                Messages.error("Invalid VPI/VCI field format.");
                return false;
            }

            updates = {
                'HPNA_Enable': $("#hpna_enable").attr("state"),
                'Services_GvtConfig_AccessClass': $("#accessclass").val(),
                'PTMEthernetInterface_1_VLANInterface_1_VID': $("#vlanid").val(),
                'ATMEthernetInterface_1_ATMLinkConfig_VC': $("#vpivci").val(),
                'ATMEthernetInterface_1_ATMLinkConfig_LinkType': $("#atm_linktype").val(),
                'ATMEthernetInterface_1_ATMLinkConfig_ATMEncapsulation': $("#atm_encapsulation").val()
            };
            cli.rollback().write(updates).commit(function(res) {
                if(res.error) {
                    Messages.error(res.error);
                    return;
                }
                Messages.info('Advanced configuration successfully saved.');
                updates = {};
            });
        });
    }

    return {
        init: function(pageData) {
            data = pageData;
            // tabIndex = // get it from the addressBar
            initUI();
        }
    };
})(lite, App);
