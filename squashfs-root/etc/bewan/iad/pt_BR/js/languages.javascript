var Page = (function($, App) {
    var data, util = $.util,
        token, language;

    Messages = App.MessageUtil;

    function initLanguage() {
        if (language == 'en_US') {
            $("#radioEN").elements[0].checked ='true';
        } else {
            $("#radioPT").elements[0].checked ='true';
        }
    }

    function saveData() {
         if ($("#radioEN").elements[0].checked) {
            var newLang ='en_US';
        } else {
            var newLang ='pt_BR';
        }
        
        config.rollback()
            .write("Services_IADConfigurator_CurrentLanguage", newLang)
            .commit(function(res) {
                if(res.error) {
                    Messages.error(res.error);
                }else {
                    var last = document.URL.lastIndexOf('/');
                    var currentPage = document.URL.substring(last+1, document.URL.length);
                    document.location.href = 'http://'+lanIP+'/'+ newLang + '/admin/' +currentPage;
                }
            });
    }

    function initUI() {
        language = data.lang;
        lanIP = data.lanIP;
        token = data.token;
        config = ConfigAccess(token);
        
        initLanguage();

        $("#cancel").bind("click", function() {
            Messages.clearAll();
            initLanguage();
        });

        $("#save").bind("click", function() {
            Messages.clearAll();
            saveData();
        });
    }

    return {
        init: function(pageData) {
            data = pageData;
            initUI();
        }
    };
})(lite, App);
