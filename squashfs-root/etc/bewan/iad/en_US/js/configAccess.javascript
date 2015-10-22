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
    window: true,
    navigator: true,
    XMLHttpRequest: true,
    ActiveXObject: true,
    unescape: true
*/

/*
 * base64.js - Base64 encoding and decoding functions
 *
 * See: http://developer.mozilla.org/en/docs/DOM:window.btoa
 *      http://developer.mozilla.org/en/docs/DOM:window.atob
 *
 * Copyright (c) 2007, David Lindquist <david.lindquist@gmail.com>
 * Released under the MIT license
 */
//if (typeof btoa == 'undefined') {
function btoa(str) {
    return Base64.encode(str);
}
//}

if (typeof atob == 'undefined') {
    function atob(str) {
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        var invalid = {
            strlen: (str.length % 4 != 0),
            chars:  new RegExp('[^' + chars + ']').test(str),
            equals: (/=/.test(str) && (/=[^=]/.test(str) || /={3}/.test(str)))
        };
        if (invalid.strlen || invalid.chars || invalid.equals)
            throw new Error('Invalid base64 data');
        var decoded = [];
        var c = 0;
        while (c < str.length) {
            var i0 = chars.indexOf(str.charAt(c++));
            var i1 = chars.indexOf(str.charAt(c++));
            var i2 = chars.indexOf(str.charAt(c++));
            var i3 = chars.indexOf(str.charAt(c++));
            var buf = (i0 << 18) + (i1 << 12) + ((i2 & 63) << 6) + (i3 & 63);
            var b0 = (buf & (255 << 16)) >> 16;
            var b1 = (i2 == 64) ? -1 : (buf & (255 << 8)) >> 8;
            var b2 = (i3 == 64) ? -1 : (buf & 255);
            decoded[decoded.length] = String.fromCharCode(b0);
            if (b1 >= 0) decoded[decoded.length] = String.fromCharCode(b1);
            if (b2 >= 0) decoded[decoded.length] = String.fromCharCode(b2);
        }
        return decoded.join('');
    }
}


/**
 * A self contained, dependency free bewan box configuration access library. This is intentionally
 * kept free of any library dependencies to be able to use by itself.
 * Example usage:
 *
 * @example
 * var ca = ConfigAccess(token);
 * ca.write('WebConfigurator_ExpertLogin', 'log1')
 *    .write('WebConfigurator_ExpertPassword', 'pass1')
 *    .read('WebConfigurator_UserLogin')
 *    .write({
 *       ATMEthernetInterface_1_Enable: 1,
 *       ATMEthernetInterface_2_Enable: 0,
 *       ATMEthernetInterface_3_Enable: 0,
 *       ATMEthernetInterface_4_Enable: 0,
 *       ATMEthernetInterface_5_Enable: 0
 *    })
 *    .read([
 *       "WANConnectionDevice_1_WANPPPConnection_Enable",
 *       "WANConnectionDevice_1_WANPPPConnection_Username",
 *       "WANConnectionDevice_1_WANPPPConnection_Password"
 *    ])
 *    .fct('reboot')
 *    .clear('Firewall_Rules')
 *    .fct('ping','192.168.1.1')
 *    .commit(function(response){
 *       if(response.error) {
 *          alert(response.error);
 *       }else {
 *          alert(response.WebConfigurator_UserLogin);
 *       }
 *    });
 *
 *
 *
 * @author anaik
 */
var ConfigAccess = (function() {
   var noop = function() {},
      defaultOptions = {
         url: "/cgi-bin/generic.cgi",
         method: "POST",
         contentType: "application/x-www-form-urlencoded",
         async: true,
         data: "",
         headers: {},
         onSuccess: noop,
         onTimeout: noop,
         timeout: 0,
         onError: function(xhr, code, msg) {
            throw ("ConfigAccess: Error fetching data: " + msg + "\n"
                + xhr.responseText);
         }
      },
      
      ToString = Object.prototype.toString,
      nTrim = String.prototype.trim,
      console = window.console;


   if(typeof window.console === "undefined") {
      console = window.console = (function() {
         var log = window.opera ? window.opera.postError : function(msg) {};
         return {log: log};
      })();
   }

   function getTypeOf(that)   {
      return ToString.call(that).slice(8, -1);
   }

   function hasOwnProperty(obj, prop) {
      if(obj.hasOwnProperty)  {
         return obj.hasOwnProperty(prop);
      }
      var v = obj[prop];
      return typeof v !== "undefined" && obj.constructor.prototype[prop] !== v;
   }

   function isTypeOf(that, type) {
      return ToString.call(that).slice(8, -1) === type;
   }
   
   /**
    * Aguments the object <tt>thisObj</tt> from properties from <tt>fromObj</tt>
    * The agumentation works such that any properties not present in <tt>thisObject</tt> that are
    * available in <tt>fromObj</tt> are copied to <tt>thisObject</tt>
    * @param {Object} thisObj The object to agument
    * @param {Object} fromObj The object to agument from
    * @return {Object} The agumented <tt>thisObject</tt>
    */
   function agument(thisObj, fromObj) {
      thisObj = thisObj || {};
      for(var prop in fromObj)   {
         if(hasOwnProperty(fromObj, prop) && ! hasOwnProperty(thisObj, prop)) {
            thisObj[prop] = fromObj[prop];
         }
      }
      return thisObj;
   }

   /**
    * Wrapper over String.trim. Uses the native trim if available
    * @param {String} str The string to trim
    */
   function trim(str)  {
      if(nTrim)   {
         return nTrim.call(str);
      }
      return str.replace(/^\s+|\s+$/g, "");
   }

   /**
    * Cleans up JSON object of all the properties that are functions
    */
   function cleanJson(obj) {
      var type = getTypeOf(obj), ret, i, len, key, val, undef;

      switch(type)   {
         case "String":
         case "Number":
         case "Boolean":
            return obj;
         case "Function":
            return undef;
         case "Object":
            ret = {};
            for(key in obj) {
               if(hasOwnProperty(obj, key)) {
                  val = cleanJson(obj[key]);
                  if(typeof val !== "undefined") {
                     ret[key] = val;
                  }
               }
            }
            return ret;
         case "Array":
            ret = [];
            for(i = 0, len = obj.length; i < len; i++) {
               val = cleanJson(obj[i]);
               if(typeof val !== "undefined") {
                  ret[ret.length] = val;
               }
            }
            return ret;
         default:
            return "Unknown type: " + type;
      }
    }
    function parse_unescape_fields (obj) {
        var prop ="";
        if (typeof obj === "string") {
            obj = unescape(obj);
            return obj;
        } 
        for (prop in obj) {
            if (typeof obj[prop] === "object") parse_unescape_fields(obj[prop]);
            else if (typeof obj[prop] === "string") obj[prop] = unescape(obj[prop]);
        }
        return obj;
    }
      
   /**
    * Parses the specified text as JSON. Uses the JSON object if available
    * @param {String}  txt The json formatted string
    * @return {Object} The json object
    */
    function parseJson(txt) {
      if(typeof JSON !== "undefined") {
         var obj = JSON.parse(txt);
         obj = parse_unescape_fields(obj);
         return obj;
      }else {
         var obj = new Function("return " + txt).call();
         return cleanJson(obj);
      }
    }

   /**
    * Parses (Creates a Function object and calls it.) the JSON string and returns the JSON object
    * @param {String} txt The JSON encoded string
    */
   function parseObject(txt) {
      var obj = new Function("return " + txt).call();
      return cleanJson(obj);
   }

   /**
    * Ajax functions for config access library
    */
   function ajax(options) {
      options = agument(options, defaultOptions);
      
      var onSuccess = options.onSuccess,
      onError = options.onError,
      timeout = options.timeout,
      onTimeout = options.onTimeout,
      hasTimedOut = false,
      httpMethod = options.method,
      url = options.url,
      contentType = options.contentType,
      data = options.data,
      async = options.async === false ? false : true,
      caInstance = options.caInstance || {},
      xhr = (window.XMLHttpRequest) ? new XMLHttpRequest() :
            (window.ActiveXObject) ? new ActiveXObject("Microsoft.XMLHTTP")
            : null,
      ret;

      if(!xhr) {throw new Error("xhr unsupported");}

      // indicate ajax has started
      CA.ajaxStart();

      try {
         xhr.open(httpMethod, url, async);

         // set the content type
         if(data)  {
            xhr.setRequestHeader("Content-Type", contentType);
         }

         // set that this was request with AJAX
         xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
         
         
         // check if timeout has been set.
         if(timeout && !isNaN(timeout)) {
             console.log("Timeout is set " + timeout)
             xhr.__timeoutId = window.setTimeout(function() {
                 hasTimedOut = true;
                 xhr.abort();
                 onTimeout();
             }, timeout);
         }

         xhr.onreadystatechange = function() {
            var rs = xhr.readyState, res, code, message;
            if(rs === 2) {
               if(timeout) {
                   window.clearTimeout(xhr.__timeoutId);
               }
            }
            if(rs === 4)   {
               if(timeout && hasTimedOut) {
                   hasTimedOut = false;
                   console.log("Ready state 4 after time out");
                   return;
               }
               // indicate ajax has ended
               CA.ajaxEnd();

               code = xhr.status;
               message = xhr.statusText;
               // check for HTTP errors
               if(code >= 400 && onError) {
                  onError(xhr, code, message);
               }
               try   {
                  res = parseJson(trim(xhr.responseText));
                  caInstance.response = res;
                  onSuccess(res, code, xhr);
               }catch(err) {
                   // console.log(err.message);
                   try {
                     res = parseObject(trim(xhr.responseText));
                     caInstance.response = res;
                     onSuccess(res, code, xhr);
                   }catch(e) {
                      onError(xhr, code, e.message);
                   }
               }
            }
         };

         // send the request
         xhr.send(data);
         
         if(!async) {
            try   {
               ret = parseJson(trim(xhr.responseText));
               caInstance.response = ret;
            }catch(err) {
               // console.log(err.message);
               try {
                  ret = parseObject(trim(xhr.responseText));
                  caInstance.response = ret;
               }catch(e) {
                  onError(xhr, code, e.message);
               }
            }
         }
         
         return ret;
      }catch(e) {
         // indicate ajax has abruptly ended
         CA.ajaxEnd();
      }
   }
   
   
   function encrypt(key, word) {
        var mask = '^\\*+', reg = new RegExp(mask, "g");
        if ( !word.match(reg) ) {
            var i=0, j=0, k=0;
            var stringCrypt, tabNumber=[], tabNumberKey=[], tabCrypt=[];

            for ( i = 0; i < word.length; ++i ) {
                tabNumber[i] = word.charCodeAt(i);
            }
            for ( i = 0; i < key.length; ++i ) {
                tabNumberKey[i] = key.charCodeAt(i);
            }

            while ( j < word.length ) {
                stringCrypt = parseInt(tabNumber[j]) + parseInt(tabNumberKey[k]);
                stringCrypt = stringCrypt - 94;
                if ( stringCrypt > 126 ) stringCrypt = stringCrypt - 94;
                
                var hexChar = stringCrypt.toString(16).toUpperCase();
                if ( hexChar.length == 1 ) hexChar = "0" + hexChar;
                tabCrypt[j] = hexChar;
                if ( k < (key.length - 1) ) {
                    k += 1;
                } else {
                    k = 0;
                }
                j += 1;
            }
            return btoa(tabCrypt.join(""));
        }
        return null;
   }
   
   /**
    * The main function that creates a new ConfigAccess Object
    * @usage
    * var cli = ConfigAccess("T0K3N");
    */
   function CA(tkn, overrides) {
      var token = tkn,
      
      // overrideOpts = agument({}, options),

      creates = [], reads = [], writes = {}, storeOnlys = {}, clears = [], functions = {}, resets = {}, deletes = [],

      clearData = function() {
         creates = [];
         reads = [];
         writes = {};
         clears = [];
         functions = {};
         resets = {};
         deletes = [];
      };

      function op(accum, opName, opData) {
         var i, len, key, val, tmp;

         if(isTypeOf(opData, "Array")) {
            for(i = 0, len = opData.length; i < len; i++) {
               accum.push(opName + "=" + encodeURIComponent(opData[i]));
            }
         }else {
            for(key in opData)   {
               tmp = opName + "=" + encodeURIComponent(key);
               val = opData[key];
               if(val != null)  { // 0 can be a value (also null == undefined is true)
                  tmp += (":" + encodeURIComponent(val));
               }
               accum.push(tmp);
            }
         }
      }

      function storeInArray(arr, pName) {
          if(getTypeOf(pName) === "Array") {
              for(var i = 0, len = pName.length; i < len; i++) {
                  arr[arr.length] = pName[i];
              }
          }else {
               arr[arr.length] = pName;
          }
      }

      function storeInObject(obj, pName, value) {
          if(getTypeOf(pName) === "Object") {
              for(var key in pName) {
                  if(hasOwnProperty(pName, key)) {
                      obj[key] = pName[key];
                  }
              }
          }else {
             obj[pName] = value;
          }
      }

      function assembleData() {
         var post = ["token=" + token];
         // accumulate all the data
         op(post, "clear", clears); // WARNING The clear has to always go first!! Backend does NOT check for clears to execute first
         op(post, "create", creates);
         op(post, "read", reads);
         op(post, "write", writes);
         op(post, "storeonly", storeOnlys);
         op(post, "remove", deletes);
         op(post, "reset", resets);
         op(post, "fct", functions);

         return post.join("&");
      }

      return {
         /**
          * Queues up a 'create new parameter' in the configlib.
          * @param {Array|String} pName An array of parameter names or a single parameter name
          * @return {Object} The current ConfigAccess object
          * @example
          * var ca = ConfigAccess(token);
          * ca.create(["VoiceProfile_2", VoiceProfile_3"]) // as an array of strings
          *     .create("VoiceProfile_4") // or a single parameter
          *     .commit(function(res) {
          *         alert(res);
          *     });
          */
         create: function(pName) {
            storeInArray(creates, pName);
            return this;
         },

         /**
          * Queues up a 'read' parameter request from configlib.
          * @param {Array|String} pName An array of parameter names or a single parameter name
          * @return {Object} The current ConfigAccess object
          * @example
          * var ca = ConfigAccess(token);
          * ca.read(["VoiceProfile_2", VoiceProfile_3"]) // as an array of strings
          *     .read("VoiceProfile_4") // or a single parameter
          *     .commit(function(res) {
          *         alert(res);
          *     });
          */
         read: function(pName) {
            storeInArray(reads, pName);
            return this;
         },

         /**
          * Queues a 'write' parameter or a set of parameters to the configlib.
          * @param {String|Object} pName The name of parameter. If this is an object, its considered to be an object of
          * name=value pairs. In this case, the second argument is ignored.
          * @param {String} value The value of the parameter to write. This is only used if the first argument is a String
          * @param {boolean} storeOnly If only store is required (without running related scripts on the server), set this to true
          * @return {Object} The current ConfigAccess object
          * @example
          * var ca = ConfigAccess(token);
          * ca.write('WebConfigurator_ExpertLogin', 'log1') // as single name value argments
          *    .write({                                     // as an object containing name-value pairs
          *       ATMEthernetInterface_1_Enable: 1,
          *       ATMEthernetInterface_2_Enable: 0,
          *       ATMEthernetInterface_3_Enable: 0,
          *       ATMEthernetInterface_4_Enable: 0,
          *       ATMEthernetInterface_5_Enable: 0
          *    }).commit(function(res) {
          *        alert(res);
          *    });
          */
         write: function(pName, value, storeOnly) {
            if(isTypeOf(pName, "Object")) {
               storeOnly = value;
            }
            
            if(storeOnly) {
               storeInObject(storeOnlys, pName, value);
            }else {
               storeInObject(writes, pName, value);
            }
            return this;
         },
         
         /**
          * Encrypts the value before writing. 
          * @param {String} pName The parameter name
          * @param {String|Primitive} value The value for the parameter
          * @param {boolean} storeOnly If only store is required (without running related scripts on the server), set this to true
          */
         encrypt: function(pName, value, storeOnly) {
            var encrypted = encrypt(token, value);
            if(!encrypted) {
                console.log("Function encrypt() returned null. Not storing value for " + pName);
                return this;
            }            
            if(storeOnly) {
               storeInObject(storeOnlys, pName, encrypted);
            }else {
               storeInObject(writes, pName, encrypted);
            }
            return this;
         },

         /**
          * Same as encrypt but return encrypted value. 
          * @param {String} pName The parameter name
          * @param {String|Primitive} value The value for the parameter
          * @param {boolean} storeOnly If only store is required (without running related scripts on the server), set this to true
          */
         __encrypt: function(pName, value, storeOnly) {
            var encrypted = encrypt(token, value);
            if(!encrypted) {
                console.log("Function encrypt() returned null. Not storing value for " + pName);
                return this;
            }            
            return encrypted;
         },

         /**
          * Queues a function call from the backend with or without arguments
          * @param {String} fName The name of the function
          * @param {String} args A string representing arguments to the function
          * @return {Object} The current ConfigAccess object
          * @example
          * var ca = ConfigAcces(token);
          * ca.fct("ping", "www.yahoo.com")
          *     .fct("date")
          *     .commit(function(res) {
          *         alert(res);
          *     });
          */
         fct: function(fName, args)  {
            functions[fName] = args || null;
            return this;
         },

         /**
          * Clears a parameter or a set of parameters in the configlib
          * @param {Array|String} pName An array of parameter names or a single parameter name
          * @return {Object} The current ConfigAccess object
          * @example
          * var ca = ConfigAccess(token);
          * ca.clear(["VoiceProfile_2", VoiceProfile_3"]) // as an array of strings
          *     .clear("VoiceProfile_4") // or a single parameter
          *     .commit(function(res) {
          *         alert(res);
          *     });
          */
         clear: function(pName) {
            storeInArray(clears, pName);
            return this;
         },

         /**
          * None of the ConfigAccess data is sent to the server unless the commit method is called. This method allows
          * you to rollback all the configlib parameters you have queued via the read, reset, del, fct, write and create.
          * This allows you to reuse the ConfigAccess object accross multiple requests
          * @return {Object} The current ConfigAccess object
          * @example
          * var ca = ConfigAccess(token);
          * ca.read("VoiceProfile_1")
          *     .write("VoiceProfile_1_Name", "Foo")
          *     .commit(function(res) {
          *         alert("Done");
          *     });
          * //... do something else and later...
          * ca.rollback()                   // clear all the previous data
          *     .read("VoiceProfile_3")     // will now only contain only 'read' of 'VoiceProfile_3'
          *     .commit(function(res) {
          *         alert(res.VoiceProfile_3);
          *     });
          */
         rollback: function()   {
            clearData();
            return this;
         },

         /**
          * Queues a 'reset' request for a paraemeter or given set of parameters
          * @param {String} pName The parameter name or an object containing parameter names and corrosponding useFactory values
          * @param {Number} numUseFac Whether to reset to factory default or the paramter's default value. If the value is
          * 0, the value is reset to the default value, else if its 1, the value is set to factory value.
          * @return {Object} The current ConfigAccess object
          * @example
          * var ca = ConfigAccess(token);
          * ca.reset("User_2_Password", 1)
          *     .reset("VoiceProfile_1_Name", 0)
          *     .reset({
          *         User_3_Password: 1,
          *         User_4_Password: 0
          *     }).commit(function(res) {
          *         alert("Yay!!");
          *     });
          */
         reset: function(pName, numUseFac) {
            storeInObject(resets, pName, numUseFac);
            return this;
         },

         /**
          * A convenience method ot reset a Parameter to factory defaults
          * @param {Array|String} pName A parameter name or array of parameter names
          * @return {Object} The current ConfigAccess object
          * @example
          * var ca = ConfigAccess(token);
          * ca.resetToFactory("VoiceProfile_1")
          *     .resetToFactory(["User_2_Password", "User_3_Password"])
          *     .commit(function(res) {
          *         alert("Yay!!");
          *     });
          */
         resetToFactory: function(pName) {
             if(getTypeOf(pName) === "Array") {
                 for(var i = 0, len = pName.length; i < len; i++) {
                     this.reset(pName[i], 1);
                 }
             }else {
                 this.reset(pName, 1);
             }
             return this;
         },

         /**
          * A convenience method to reset to a parameter's default value
          * @see resetToFactory
          * @see reset
          */
         resetToDefault: function(pName) {
             if(getTypeOf(pName) === "Array") {
                 for(var i = 0, len = pName.length; i < len; i++) {
                     this.reset(pName[i], 0);
                 }
             }else {
                 this.reset(pName, 0);
             }
             return this;
         },

         /**
          * Queues a 'remove' parameter request
          * @param {Array|String} pName A parameter name or array of parameter names
          * @return {Object} The current ConfigAccess object
          */
         remove: function(pName) {
             storeInArray(deletes, pName);
             return this;
         },

         /**
          * Reverts the queued changes
          * @deprecated backwards compatibility, use rollback instead
          */
         revert: function() {
             console.log("WARNING! 'ConfigAccess.revert' is deprecated, use 'ConfigAccess.rollback' instead.");
             return this.rollback();
         },

         /**
          * Gets all the queued data as a query string. This is used for debugging
          */
         getData: function() {
            return assembleData();
         },
         
         /**
          * Commits (saves) the data queued into this config access object to the server
          * @param {Function} success The optional function to call when commit is successful
          * @param {Function} error The optional function to call if there was an error sending data.
          */
         commit: function(success, error) {
            var postData = assembleData(), 
                self = this, 
                opts = agument({}, overrides);
                
            opts.caInstance = self;
            opts.data = postData;
            if(success) {
                opts.onSuccess = success;
            }
            if(error) {
                opts.onError = error;
            }
            ajax(opts);
         },
         
         commitSync: function(onError) {
            var postData = assembleData(), self = this, opts = agument({}, overrides);

            opts.async = false;
            opts.caInstance = self;
            opts.data = postData;
            if(onError) {
                opts.onError = onError
            }
            return ajax(opts);
         },

         /**
          * Commits (saves) the data queued into this config access object to the server and redirects the browser
          * to another page specified by 'path'
          */
         commitRedirect: function(path) {
             this.commit(function(res) {
                 if(res.error) {
                     alert(res.error);
                 }else {
                     window.location.href = (window.showValidPages == null || window.showValidPages == true) ? 
                           path : (alert('Configuration saved'), document.URL);
                 }
             });
         }
	  };
	}
   
   // expost the encrypt as a property of the ConfigAccess function
   CA.encrypt = encrypt;

   /**
    * These functions are called globally whenever there's an ajax request starts or ends. These cane be used to 
    * show a working/loading notifications on the UI
    */
   CA.ajaxStart = function() {         
      (document.body.style || {}).cursor = 'wait';
   };
   CA.ajaxEnd = function() {
      (document.body.style || {}).cursor = 'auto';
   };

   return CA;
})();
