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
    }
    
    return {
        init: function(pageData) {
            data = pageData;
            // tabIndex = // get it from the addressBar
            initUI();
        }
    };
})(lite, App);
