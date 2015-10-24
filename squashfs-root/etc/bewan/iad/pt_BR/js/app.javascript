/*jslint
    nomen: false,
    debug: true,
    indent: 3,
    plusplus: false,
    evil: true, 
    onevar: true,
    browser: true,
    white: false
*/
/*global
    lite: true,
    window: true,
    navigator: true,
    XMLHttpRequest: true,
    ActiveXObject: true,
    unescape: true,
    escape: true
*/
var App = {};

/**
 * A simplistic binder for managing (showing, serializing, retrieving) data in a page
 * @author anaik
 */
App.DataBinder = (function($) {
    var replaceReg = /^\-([^\-]+)\-$/,
    
    // these don't work with querySelectorAll :(
    // /^#([^#]+)#$/, 
    // /^\{([^\{\}]+)\}$/, 
    util = $.util;
        
    function defaultFormatter(val) {
        return (typeof val === "undefined" || val === null) ? "" : val;
    }
    
    function isIndexedKey(key) {
        // return key.indexOf("{") === 0 && key.lastIndexOf("}") === key.length - 1;
        return key.indexOf("-") === 0 && key.lastIndexOf("-") === key.length - 1;
    }
    
    /**
     * Gets the current value of the bound field
     */
    function getValue(ctx) {
       var bindId = ctx.bindId,
         formatter = ctx.formatter,
         fld = ctx.field,
         fldRaw = fld.get(0),
         val, 
         indices = ctx.indices = ctx.indices || {}, 
         key = bindId;
       
       if(fldRaw) {
          if(typeof(fldRaw.value) !== "undefined") {
             val = fld.val();
          }else {
             val = fld.html();
          }
       }
       
       util.forEach(indices, function(index, indexKey) {
           key = key.replace("-" + indexKey + "-", index);
       });
       
       val = formatter(val, ctx);
       if(val === null || typeof val === "undefined") {
          val = "";
       }
       
       return {
          key: key,
          value: val
       };
    }

    /**
     * Writes the value in data to the bound field
     */
    function setValue(ctx) {
        var bindId = ctx.bindId, 
            data = ctx.data, 
            formatter = ctx.formatter, 
            keys = bindId.split("_"), 
            tmp = data,
            indices = ctx.indices = ctx.indices || {},
            fld = ctx.field,
            target = ctx.target || {},
            entireKey = [],
            fldRaw = fld.get(0);
        
        if(!fldRaw) {
           console.log("Field not found: " + bindId);
           return;
        }
        
        util.forEach(keys, function(k) {
            var actKey;
            if(!tmp) {
                return util.Break;
            }
            
            if(isIndexedKey(k)) {
                actKey = replaceReg.exec(k)[1];
                actKey = indices[actKey];
            }else {
                actKey = k;
            }
            entireKey.push(actKey);
            tmp = tmp[actKey];
            return null;
        });
        
        entireKey = entireKey.join("_");
        // console.log(entireKey);
        if(typeof target[entireKey] !== "undefined") {
            tmp = target[entireKey];
        }
        if(typeof fldRaw.value !== "undefined") {
            fld.val(formatter(tmp, ctx));
        }else {
            fld.html(formatter(tmp, ctx));
        }
    }
    
    function cliSerializer(ctx) {
       var data = ctx.target = ctx.target || {},
       objValue = getValue(ctx),
       value = objValue.value,
       key = objValue.key;
       
       data[key] = value;
    }
    
    function jsonSerializer(ctx) {
       var bindId = ctx.bindId,
       data = ctx.target = ctx.target || {},
       keys = bindId.split('_'),
       tmp = data,
       tmpParent,
       value = getValue(ctx).value, 
       actKey, i, len;
       
       for(i = 0, len = keys.length; i < len; i++) {
          actKey = keys[i];
          if(isIndexedKey(actKey)) {
              actKey = replaceReg.exec(actKey)[1];
              actKey = ctx.indices[actKey] + "";
          }
          tmpParent = tmp;
          tmp[actKey] = tmp[actKey] || {};
          tmp = tmp[actKey];
       }
       tmpParent[actKey] = value;
    }
    
    /**
     * Creates a data binder with specified options
     * @example 
     * var binder = App.Binder({
     *    fields: [
     *       "LANDevice_-lanId-_HostConfig_DomainName",
     *       "LANDevice_-lanId-_HostConfig_MinAddress",
     *       "LANDevice_-lanId-_HostConfig_MaxAddress",
     *       "LANDevice_1_HostConfig_DHCPLeaseTime" // you can also give direct names without indices
     *    ],
     *    formatters: {
     *      "LANDevice_-lanId-_HostConfig_DHCPLeaseTime": function(val) {
     *          return val + " secs";
     *      }
     *    }
     * });
     */
    return function(options) {
        var fields = options.fields || [], formatters = options.formatters || {}, binder, 
            onfieldchange = options.onfieldchange;
        
        function createContext(opts, eId) {
           opts = opts || {};
           return {
               bindId: eId,
               field: $("#" + eId),
               formatter: formatters[eId] || defaultFormatter,
               data: opts.data,
               target: opts.target,
               indices: opts.indices
           };
        }
        
        binder = {
            /**
             * Writes the data to the fields or labels in the HTML dom
             * @example 
             * var binder = Binder(data);
             * binder.write({
             *    data: someData,
             *    indices: {
             *      lanIdx: 1
             *    }
             * });
             */
            write: function(options) {
               if(!options.data) {
                  console.log("No data to write");
               }
               util.forEach(fields, function(eId) {
                   var ctx = createContext(options, eId);
                   ctx.operation = "write";
                   setValue(ctx);
               });
            },
            
            read: function(options) {
               var ret = {};
               util.forEach(fields, function(fId) {
                  var ctx = createContext(options, fId), val;
                  
                  // indicate that this is a reading operaion
                  // this is useful for formatters that format data while reading or writing
                  ctx.operation = "read";
                  
                  val = getValue(ctx);
                  ret[val.key] = val.value;
               });
               return ret;
            },
            
            serialize: function(options, path) {
               var ctx = createContext(options, path);
               ctx.operation = "read";
               cliSerializer(ctx);
            },
            
            getFields: function() {
               return fields.slice(0);
            }
        };
        
        function fieldChangeHandler(evt) {
           return onfieldchange(evt.target, binder);
        }
        
        // some initialization code (If onchange field handler is specified, call it every time a binder field changes
        if(typeof onfieldchange === "function") {
           util.forEach(fields, function(fId) {
              var f = $("#" + fId), 
                 fType = f.attr("type"), 
                 // checkboxes and radio buttons behave differently on IE, 
                 // in some corner cases they don't fire change events properly
                 evt = (fType === "checkbox" || fType == "radio" || fType == "switch") ? "click" : "change";
              f.bind(evt, fieldChangeHandler);
           });
        }
        
        return binder;
    };
})(lite);


/**
 * UI messages for application
 * Derived from http://code.google.com/p/jaf
 * @author anaik
 */
App.MessageUtil = (function($)   {
   var Util = $.util, 
   msgTemplate = $.template('<p title=\'Clique para descartar \' id="{msgId}" class="message {msgType}">{msg}</p>');

   function delayedClear(id)   {
      window.setTimeout(function() {
         var messages = $("#messages");
         messages.remove("#" + id);
         if(messages.find(".message").count() === 0) {
            messages.addClass("none");
         }
      }, 5000);
   }
   
   var mUtil =  {
      error: function(strMessage)   {
         return mUtil.show("error", strMessage);
      },
      
      warn: function(strMessage) {
         return mUtil.show("warn", strMessage);
      },
      
      info: function(strMessage, bAutoClear) {
         var id = mUtil.show("info", strMessage);
         if(bAutoClear !== false)   {
            delayedClear(id);
         }
         return id;
      },
      
      show: function(strType, strMessage, bOverwrite) {
         var messages = $("#messages"), id = Util.nextUniqueId(), htmlMsg;
         
         htmlMsg = msgTemplate.process({
            msgId: id,
            msgType: strType,
            msg: strMessage
         });
         
         if(! bOverwrite)   {
            messages.prepend(htmlMsg);
         }else {
            messages.html(htmlMsg);
         }
         
         messages.removeClass("none");
         messages.addClass(strType);

         // scroll to top to show messages
         $('body').get(0).scrollTop = 0;
         $('html').get(0).scrollTop = 0;
         return id;
      },
      
      clear: function(id)  {
         var messages = $("#messages");
         messages.remove("#" + id);
         if(messages.find(".message").count() === 0) {
            messages.addClass("none")
         }
      },

      clearAll: function() {
         var messages = $("#messages");
         messages.html("");
         messages.addClass("none");
      }
   };
   
   return mUtil;
})(lite);



/**
 * Rendering for validation messages
 * Derived from http://code.google.com/p/jaf
 * @author anaik
 */
App.ValidationRenderer = (function($) {
   var msgUtil = App.MessageUtil, util = $.util;

   return {      
      render: function(arrMsg)   {
         var msgs = [];
         this.ids = [];
         util.forEach(arrMsg, function(msg) {
            var id = msg.id;
            this.ids.push(id);
            msgs.push(msg.message);
            $("#" + id).addClass("invalid");
         }, this);
         alert(msgs.join("\n"));
      },

      clear: function() {
         if(! this.ids) {
             return;
         }
         util.forEach(this.ids, function(id) {
            $("#" + id).removeClass("invalid");
         });
      }
   };
})(lite);


App.ValidationMessageRenderer = (function($) {
    var util = $.util;

    return function() {
        return {      
            render: function(arrMsg)   {
                this.ids = [];
                util.forEach(arrMsg, function(msg) {
                    var id = msg.id, field = $("#" + id), elem = field.get(0), par;
                    this.ids.push(id);

                    field.addClass("invalid");
                    if(elem) {
                        par = $(elem.parentNode);
                        // only if there are already no existing validation messages
                        // showing
                        if(par.find("span.vmsg").count() === 0) {
                            par.append($('<span class="vmsg error">' + msg.message + "</span>"));
                        }
                    }
                }, this);
            },

            clear: function() {
                if(! this.ids) {
                    return;
                }
                util.forEach(this.ids, function(id) {
                    var field = $("#" + id), elem = field.get(0), par;
                    field.removeClass("invalid");
                    if(elem) {
                        par = $(elem.parentNode);
                        par.remove("span.vmsg");
                    }
                });
            }
        };
    }
})(lite);



// our application specific global ready for generic onready handlers
$.event.ready(function() {   
   var util = lite.util, msgUtil = App.MessageUtil, bodyStyle, defaultAction, messages = $("#messages");
   
   // Initialize the global accordion menu.
   if(typeof initmenu === "function") {
      initmenu();
   }
   
   
   
   // this is for IE browsers including IE8 that don't support nth-child and nth-of-type pseudo classes
   /*
   var tbls = $("table.data-table > tbody");
   util.forEach(tbls.elements, function(tbl) {
      var trs = $(tbl).find("tr");
      util.forEach(trs.elements, function(tr, i) {
         if(i % 2 === 0)   {
            $(tr).addClass("even");
         }
      });
   });
   */
   
   
   
   // Messages rendering for application messages.
   if(!messages.count()) {
        messages = $("#col-722").prepend('<div class="none" id="messages"></div>').find("#messages");
        messages.bind("click", function() {
            msgUtil.clearAll();
        });
    }
   
   
   
   // ConfigAccess ajax notification: Check if there's any ajax operations via config access
   if(typeof ConfigAccess === "function") {
      bodyStyle = document.body.style || {};
      ConfigAccess.ajaxStart = function() {
         var scrollTop = document.documentElement.scrollTop || document.body.scrollTop || 0;
         $("#toast").css("top", (scrollTop + 2) + "px").addClass("show");
         // bodyStyle.cursor = 'wait';
      }
      ConfigAccess.ajaxEnd = function() {
         // bodyStyle.cursor = 'auto';
         $("#toast").removeClass("show");
      }
   }
   
   
   
   // Enter key action for forms
   /*
   function shouldIgnore(target) {
      var tName = (target.nodeName || "").toLowerCase();
      return (tName === "textarea" || tName === "a" || tName === "select" || tName === "button"
         || (tName === "input" && target.type === "button"));
   }
   defaultAction = document.onkeypress;
   if(!defaultAction || defaultAction._name !== "DefaultPageAction") {
       $(document).bind("keypress", function(e) {
          var target, butt;
          if(e.keyCode === 13) {
             target = e.target;
             
             if(shouldIgnore(target)) {
                return true;
             }
             butt = $("#content").find(".primary-action").get(0);
             if(butt) {
                 if(typeof butt.click === "function") {
                    butt.click();
                 }else {
                     $(butt).dispatch("click");
                 }
                 e.stopPropagation();
                 e.preventDefault();
                 return false;
             }
          }
          return true;
       });
   }
   */
   
   // Content fade in on page load EXPERIMENTAL!!!
   $("#content").addClass("reveal");
   
});

$.event.ready(function() {
	$("#content").append("<div class='footer'><div class='footer-inner'><div class='wrap'><a href='http://www.tripleoxygen.net/wiki/modem/v5471' target='_blank'>Pace V5471 42k Series</a> &copy; 2015 <a href='http://www.tripleoxygen.net' target='_blank'>Triple Oxygen</a> | Este é um trabalho para a comunidade e gratuito. Se pagou por ele, exija seu dinheiro de volta.</div></div></div>");
});
