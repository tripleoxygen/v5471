var admin = "",
    tech = "",
    hideBasic = false,
    hideExpert = false,
    hideAdmin = false,
    isRemote = false,
    nasPort,
    
    currentLang = eval(' (<!--#echo jsonvar="cli=Services_IADConfigurator_CurrentLanguage"--> ) '),
    availableLangs = eval(' ( <!--#echo jsonvar="cli=Services_IADConfigurator_AvailableLanguages"--> ) '),
    langMap = {
        en_US: 'English',
        pt_BR: 'Português',
        fr_FR: 'Français'
    },
    langToken = eval('(<!--#echo jsonvar="token=Services_IADConfigurator"-->)'),
    lanIP= eval(' (<!--#echo jsonvar="cli=LANDevice_1_IPInterface_1_IPAddress"--> ) '),
    hasNASServer = eval(' ( <!--#echo jsonvar="cli=Services_NAS_Enable"--> ) '),
    nasServerPort = eval(' ( <!--#echo jsonvar="cli=HttpServer_*[Service=NAS]_ListenPort"--> ) '),
    proxyServer = eval(' ( <!--#echo jsonvar="cli=HttpServer_*[Service=NAS]"--> ) '),
    indexHttpServer = eval(' ( <!--#echo jsonvar="cli=Services_NAS_HttpServer"--> ) ');

window.showValidPages = false;

//check remote user
var regExp = new RegExp("^https","g");
if (document.location.href.match(regExp)) {
	isRemote = true;
}

if(proxyServer[indexHttpServer]) {
    if (hasNASServer && proxyServer[indexHttpServer].Enable == '1') {
        nasPort = proxyServer[indexHttpServer].ListenPort;
    }else {
        nasPort = nasServerPort.ListenPort;
    }
}

var last = document.URL.lastIndexOf('/');
var currentUser = document.URL.substring(document.URL.lastIndexOf('/',last-1)+1, last);
if (currentUser == currentLang) currentUser = '';

<!--#include file="files.txt"-->


var menuArr = [
    '<ul id="mainNav" class="accordion">',
        '<li class="menu" id="menu_status"><a class="menu-header" href="services_status.htm">Status</a></li>',
        '<li class="menu" id="menu_settings">',
            '<a class="menu-header" href="#settings">Configuração</a>',
            '<ul class="ulmenu">',
                '<li id="menu_internet"><a href="config_internet.htm"><strong>Internet</strong></a></li>',
                '<li id="menu_lan"><a href="config_lan.htm"><strong>Rede Local</strong></a></li>',
                '<li id="menu_wireless"><a href="config_wireless.htm"><strong>Rede Wi-Fi</strong></a></li>',
                '<li id="menu_applications"><a href="config_apps.htm"><strong>Jogos e Aplicativos</strong></a></li>',
<!--#check Services_GvtConfig_AccessClass=4&file= -->
		'<li id="menu_firewall"><a href="config_firewall.htm"><strong>Firewall</strong></a></li>',
                '<li id="menu_usb"><a href="config_usb.htm"><strong>Dispositivos USB</strong></a></li>',
<!--#endCheck var=ok-->
                '<li id="menu_wan_mode"><a href="config_wan_mode.htm"><strong>Modo da WAN</strong></a></li>',
            '</ul>',
        '</li>',
        '<li class="menu"  id="menu_management">',
            '<a class="menu-header" href="#device_management">Gerenciamento</a>',
            '<ul class="ulmenu">',
                '<li id="menu_languages"><a href="languages.htm"><strong>Idioma</a></li>',
                '<li id="menu_admin_password"><a href="admin_password.htm"><strong>Alterar Senha</strong></a></li>',
                '<li id="menu_resets"><a href="resets.htm"><strong>Reiniciar</strong></a></li>',
                '<li id="menu_bbstats"><a href="bb_stats.htm"><strong>Estatísticas</strong></a></li>',
                '<li id="menu_logread"><a href="logread.htm"><strong>Histórico</strong></a></li>',
                '<li id="menu_utilities"><a href="net_utils.htm"><strong>Ferramentas</strong></a></li>',
            '</ul>',
        '</li>',
        '<li class="menu" id="menu_about"><a class="menu-header" href="about.htm">Sobre o Power Box</a></li>',
    '</ul>'
];

/*!
 * from h5.js library
 * The MIT License
 * 
 * Copyright (c) 2011-2013 h5 Authors. All rights reserved.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var DomUtil = (function() {
    var clsRegExps = {}, 
        objToString = Object.prototype.toString,
        slice = Array.prototype.slice;
    
    function classRe(clazz) {
        return clsRegExps[clazz] || (clsRegExps[clazz] =  new RegExp("(^|\\s+)" + clazz + "(?:\\s+|$)")); // thank you xui.js :) 
    }
    
    function hasClass(elem, clName) {
        return classRe(clName).test(elem.className);
    }

    function addClass(elem, clName) {
        var cList = elem.classList;
        if(!cList || !clName) {
            return false;
        }
        cList.add(clName);
        return true;
    }

    function removeClass(elem, clName) {
        var cList = elem.classList;
        if(!cList || !clName) {
            return false;
        }
        cList.remove(clName);
        return true;
    }
    
    function isArray(that) {
        return objToString.call(that) === "[object Array]";
    }
    
    function sliceList(start, end)  {
        var arr, i, len = this.length, s = start || 0, e = end || len;
        if(isArray(this)) {
            arr = slice.call(this, s, e);
        }else {
            // so that we can have things like sliceList(1, -1);
            if(e < 0) { 
                e = len - e;
            }
            arr = [];
            for(i = s; i < e; i++) {
                arr[arr.length] = this[i];
            }
        }
        return arr;
    }
    
    function isElem(elem) {
        return elem.nodeType === 1 || elem.nodeType === 9;
    }
    
    function trim(str) {
        return str.replace(/^\s+|\s+$/g, '');
    }
    
    return {
        byId: function(id) {
            return document.getElementById(id);
        },
        
        byTagName: function(name, elem) {
            return (elem || document).getElementsByTagName(name);
        },
        
        hasClass: function(elem, cl) {
            return hasClass(elem, cl);
        },

        addClass: function(elements, cl)  {
            var el;
            if(isElem(elements)) {
                elements = [elements];
            }
            
            elements = sliceList.call(elements);
            for(var i = 0, len = elements.length; i < len; i++) {
                el = elements[i];
                if(!hasClass(el, cl) && !addClass(el, cl)) {
                    el.className += " " + cl;
                }
            }
            return this;
        },

        removeClass: function(elems, cl)  {
            var el;
            if(isElem(elems)) {
                elems = [elems];
            }
            
            elems = sliceList.call(elems);
            for(var i = 0, len = elems.length; i < len; i++) {
                el = elems[i];
                if(hasClass(el, cl) && !removeClass(el, cl)) {
                    el.className = trim(el.className.replace(classRe(cl), "$1"));
                }
            }
            return this;
        },
        
        toggleClass: function(elems, cl) {
            var el;
            if(isElem(elems)) {
                elems = [elems];
            }
            
            elems = sliceList.call(elems);
            for(var i = 0, len = elems.length; i < len; i++) {
                el = elems[i];
                if(this.hasClass(el, cl)) {
                    this.removeClass(el, cl);
                }else {
                    this.addClass(el, cl);
                }
            }
            return this;
        },
        
        children: function(element, optTagName) {
            var children = element.childNodes, ret = [], i, len, child;
            for(i = 0, len = children.length; i < len; i++) {
                child = children[i];
                if(child.nodeType === 1 && (optTagName ? child.nodeName.toLowerCase() === optTagName.toLowerCase() : true)) {
                    ret[ret.length] = child;
                } 
            }
            return ret;
        }
    };
})();

function ImportLanguage() {
    if ( document.URL.indexOf('en_US' , 0) >= 0 ){
        var temp = '<a class="current">English</a> <a onclick="changeLanguage(\'pt_BR\');">Português</a>';
    } else {
        var temp = '<a  onclick="changeLanguage(\'en_US\');">English</a> <a class="current">Português</a>';
    }
    document.write(temp);
}

function changeLanguage(lg) {
    var last = document.URL.lastIndexOf('/');
    var currentPage = document.URL.substring(last+1, document.URL.length);
    document.location.href = 'http://'+lanIP+'/'+lg + '/admin/' +currentPage;
}    

function toggleMenuItem(item) {
    var id = item.id;
    var childMenu = item.getElementsByTagName("ul")[0],
        morpheus = window.morpheus || function(item, props) {
            item.style.height = props.height + "px";
        };
        
    DomUtil.toggleClass(item, "expanded");

    if(!childMenu) {
        return;
    }

    if(item.anim) {
        item.anim.stop();
    }

    if(DomUtil.hasClass(item, "expanded")) {
        item.anim = morpheus(item, {
            duration: 200,
            height: (childMenu.offsetHeight + 42)
        });
    }else {
        item.anim = morpheus(item, {
            duration: 200,
            height: 40
        });
    }
    
    //we hide other expanded menus
    var menus = $(".menu").elements;
    for (var i in menus){
        if (menus[i].id != id && DomUtil.hasClass(menus[i], "expanded")) {
            DomUtil.toggleClass(menus[i], "expanded");
            menus[i].anim = morpheus(menus[i], {
                duration: 200,
                height: 40
            });
        }
    }
}


function initMenu(root) {
    var rootLis = DomUtil.children(root, "li"), menuItem;
    for(var i = 0, len = rootLis.length; i < len; i++) {
        menuItem = rootLis[i], trigger = DomUtil.children(menuItem, "a")[0] || {};
        
        trigger.onclick = (function(item) {
            return function() {
                toggleMenuItem(item);
            };
        })(menuItem);
    }
}


function ImportMenu(selected){
    document.write(menuArr.join("\n"));
    
    var mainNav = DomUtil.byId("mainNav"),
        selectedItem = selected ? DomUtil.byId(selected) : null,
        menuItems = DomUtil.byTagName("li", mainNav),
        parent;
        
    // initialize the menu first
    initMenu(mainNav);
        
    DomUtil.removeClass(menuItems, "active");
        
    if(selectedItem) {
        DomUtil.addClass(selectedItem, "active");
        
        if(! DomUtil.hasClass(selectedItem, "menu")) {
            parent = selectedItem.parentNode;
            while(parent != mainNav) {
                if(parent.nodeName.toLowerCase() === "ul") {
                    parent = parent.parentNode;
                    continue;
                }
                if(DomUtil.hasClass(parent, "menu")) {
                    DomUtil.addClass(parent, "active");
                    toggleMenuItem(parent);
                    break;
                }
                parent = parent.parentNode;
            }
        }
    }
}

function ImportFooter() {}

