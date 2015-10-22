function createObjectAJAX() {
    var xhr_object = null;
    if(window.XMLHttpRequest) //For Firefox
    {xhr_object = new XMLHttpRequest();}
    else if(window.ActiveXObject){ // Internet Explorer 
        try {
            xhr_object = new ActiveXObject("Msxml2.XMLHTTP");
        } catch (e) 
        {
            xhr_object = new ActiveXObject("Microsoft.XMLHTTP");
        }
    }
    else {alert("Votre navigateur ne supporte pas les objets XMLHTTPRequest...");return;}
    return xhr_object;
}

var Page = (function($, App) {
    var data, util = $.util,
        token,
        adminUserIdx,
        validator;

    Messages = App.MessageUtil;

    function checkRules() {
        var regExp1 = new RegExp("\\d");
        var regExp2 = new RegExp("[a-zA-Z]");
        var changePass = $("#changePass");
        var changeConfirmPass = $("#changeConfirmPass");
        changePass.removeClass("invalid");
        changeConfirmPass.removeClass("invalid");
        var val = changePass.val();
        var val2 = changeConfirmPass.val();

        if (regExp1.test(val) && regExp2.test(val) && val.length >= 8 ) {
            if (val != val2) {
                changeConfirmPass.addClass("invalid");
                Messages.error('As senhas devem ser iguais.');
                return false;
            } else {
                return true;
            }
        } else {
            changePass.addClass("invalid");
            Messages.error('Desculpe, sua senha não é suficientemente segura. Sua senha precisa ter pelo menos 8 caracteres e uma mistura de letras e números. Por favor digite outra senha.');
            return false
        }
    }


    function encryptString(str) {
        var cfgEncrypt = new ConfigAccess(token);
        return cfgEncrypt.__encrypt(token,str);
}

    function notifyNoAdmin() {
        $("#noAdmin").removeClass("hidden");
        $("#changePassDetails").addClass("hidden");
        $("#actions").addClass("hidden");
    }

    function initUI() {
        var User = data.User, adminUserList;

        if(!User) {
            notifyNoAdmin();
            return;
        }

        adminUserList = User.List ? User.List.split(",") : [];
        adminUserIdx = adminUserList[0];

        if(!adminUserIdx) {
            notifyNoAdmin();
            return;
        }
        token = data.token;
        config = ConfigAccess(token);

        $("#cancel").bind("click", function() {
            Messages.clearAll();
            $("#oldPass").val('');
            $("#oldPass").removeClass("invalid");
            $("#changePass").val('');
            $("#changePass").removeClass("invalid");
            $("#changeConfirmPass").val('');
            $("#changeConfirmPass").removeClass("invalid");
        });

        $("#save").bind("click", function() {
            Messages.clearAll();
            if(checkRules()) { 
                $("#oldPass").removeClass("invalid");
                var oldPassword = encryptString($("#oldPass").val());
                var newPassword = encryptString($("#changePass").val());

                var data = "cust_auth=1&token="+token+"&request=password&login=admin&currentpassword="+oldPassword+"&newpassword1="+newPassword;
                xhr_object = createObjectAJAX();
                xhr_object.onreadystatechange = function()
                {
                    if(xhr_object.readyState == 4)
                    {
                        var resp = xhr_object.responseText;
                        if (resp.indexOf("pwd=ko", 0) >= 0) {
                            $("#oldPass").addClass("invalid");
                            Messages.error('Usuário ou senha inválidos ');
                        } else {
                            Messages.info('Senha alterada com sucesso');
                            util.forEach(["oldPass", "changePass", "changeConfirmPass"], function(fid) {
                                $('#' + fid).val("");
                            });
                        }
                    }
                }
                xhr_object.open("POST", "../../cgi-bin/login.cgi", true);
                xhr_object.setRequestHeader("Content-Type", "application/x-www-form-urlencoded"); 
                xhr_object.send(data);
            }
        });
    }

    return {
        init: function(pageData) {
            data = pageData;
            initUI();
        }
    };
})(lite, App);
