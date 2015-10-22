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
/**
 * @fileOverview This file provides the lite.js library. lite.js is a compact, library
 * that provides a lightweight (in terms of size), limited feature alternative to jQuery. The idea is
 * that lite.js can be replaced with jQuery any time as the project gets larger and more features are
 * required. lite.js provides the familiar jQuery-like programming style. This has the benifit that
 * apps can replace lite.js with jQuery in the future with minimal or no changes to the application
 * code.
 * 
 * @author <a href="mailto:aniket3@gmail.com">Aniket Naik</a>
 */
(function(globalObject) {
    "use strict";
    // es5 shims
    (function(global) {
       var ArrayProto = Array.prototype,
       FunctionProto = Function.prototype,
       // ObjectProto = Object.prototype,
       bind,
       slice = ArrayProto.slice;

       /**
        * Function.prototype.bind
        */
       if(!FunctionProto.bind) {
          bind = function(func, thisObj /*, func args */) {
             var args = slice.call(arguments, 2);
             return function() {
                return func.apply(thisObj || global, args.concat(slice.call(arguments)));
             };
          };
          FunctionProto.bind = function(/* thisObj, a,r,g,u,m,e,n,t,s */)  {
             var args = [this].concat(slice.call(arguments));
             return bind.apply(null, args);  
          };
       }
       
       /**
        * Array indexOf
        * From MDN https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/indexOf
        */
       if (!Array.prototype.indexOf) {
           Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
               "use strict";
               if (this == null) {
                   throw new TypeError();
               }
               var t = Object(this);
               var len = t.length >>> 0;
               if (len === 0) {
                   return -1;
               }
               var n = 0;
               if (arguments.length > 0) {
                   n = Number(arguments[1]);
                   if (n != n) { // shortcut for verifying if it's NaN
                       n = 0;
                   } else if (n != 0 && n != Infinity && n != -Infinity) {
                       n = (n > 0 || -1) * Math.floor(Math.abs(n));
                   }
               }
               if (n >= len) {
                   return -1;
               }
               var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
               for (; k < len; k++) {
                   if (k in t && t[k] === searchElement) {
                       return k;
                   }
               }
               return -1;
           }
       }

       /**
        * Console logging
        */
       if(typeof global.console === "undefined") {
           global.console = (function() {
               var log = global.opera ? global.opera.postError : function() {};
               return {log: log};
           })();
       }
    })(globalObject);

    var console = globalObject.console,

    /**
     * @namespace The top level namespace lite. lite.js is a lightweight, compact library that has its
     * syntax mostly compatible with jQuery. The objective of this library is to have the app syntax as
     * close as possible to jQuery so that in future is possible to very easily migrate to jQuery with
     * minimal modifications to existing code
     */
    lite = (function(global) {
       var l = global.lite;
       if(!l)   {
          l = global.lite = global.$ = function(selector, context) {
               return $.nodelist(selector, context);
          };
       }
       return l;
    })(globalObject);



    /**
     * Utility namespace lite.util
     */
    (function(lite) {
       var ArrayProto = Array.prototype, nForEach = ArrayProto.forEach, nFilter = ArrayProto.filter,
       nTrim = String.prototype.trim, Break = {}, UID = 0, objToString = Object.prototype.toString, undef;

       function getTypeOf(that)   {
          var typeStr = objToString.call(that);
          return typeStr.slice(8, -1);
       }

       function isTypeOf(that, type) {
          var typeStr = objToString.call(that);
          return typeStr.slice(8, -1) === type;
       }

       function each(arr, callback, thisObject) {
          var o = Object(arr), retVal, i, len, key;
          if(nForEach && o.forEach === nForEach)  {
             o.forEach(callback, thisObject);
          }else if(isTypeOf(o, "Array"))  {
             for(i = 0, len = o.length; i < len; i++)  {
                if(i in o)  {
                   retVal = callback.call(thisObject, o[i], i, o);
                   if(retVal === Break) {
                      break;
                   }
                }
             }
          }else {
             for(key in o) {
                retVal = callback.call(thisObject, o[key], key, o);
                if(retVal === Break) {
                   break;
                }
             }
          }
       }

       function filter(arr, callback, thisObject) {
          var o = Object(arr), ret;
          if(nFilter && o.filter === nFilter)  {
             return o.filter(callback, thisObject);
          }else {
             ret = [];
             each(arr, function(value, idx, array) {
                if(callback.call(thisObject, value, idx, array)) {
                   ret[ret.length] = value;
                }
             });
             return ret;
          }
       }

       // clean up the JSON object, reject functions for now
       function cleanJson(obj) {
          var type = getTypeOf(obj), ret, tmp;

          switch(type)   {
             case "String":
             case "Number":
             case "Boolean":
                return obj;
                // break;
             case "Function":
                return undefined;
             case "Object":
                ret = {};
                each(obj, function(val, key) {
                   tmp = cleanJson(val);
                   if(typeof tmp !== "undefined") {
                      ret[key] = tmp;
                   }
                });
                return ret;
             case "Array":
                ret = [];
                each(obj, function(value) {
                   tmp = cleanJson(value);
                   if(typeof tmp !== "undefined") {
                      ret.push(tmp);
                   }
                });
                return ret;
             default:
                return "{Unknown type: " + type + "}";
          }
       }

       /**
        * @namespace Contains utility functions commonly needed and used in this
        * library
        */
       lite.util = {
          /**
           * Determines if the object specified has "own" property prop defined. Uses native 
           * hasOwnProperty if available
           * @param {Object} obj The object to check
           * @param {String} prop The property to check for
           * @return true if the property <tt>prop</tt> is defined in <tt>obj</tt>
           */
          hasOwnProperty: function(obj, prop) {
             if(obj.hasOwnProperty)  {
                return obj.hasOwnProperty(prop);
             }
             var v = obj[prop];
             return typeof v !== "undefined" && obj.constructor.prototype[prop] !== v;
          },

          /**
           * Aguments the object <tt>thisObj</tt> from properties from <tt>fromObj</tt>
           * The agumentation works such that any properties not present in <tt>thisObject</tt> that are
           * available in <tt>fromObj</tt> are copied to <tt>thisObject</tt>
           * @param {Object} thisObj The object to agument
           * @param {Object} fromObj The object to agument from
           * @return {Object} The agumented <tt>thisObject</tt>
           */
          agument: function(thisObj, fromObj) {
             for(var prop in fromObj)   {
                if(fromObj.hasOwnProperty(prop) && ! thisObj.hasOwnProperty(prop)) {
                   thisObj[prop] = fromObj[prop];
                }
             }
             return thisObj;
          },

          /**
           * Generates a unique ID for this window session
           * @return {String} The uniquie id
           */
          nextUniqueId: function()   {
             return "guid_" + (UID++);
          },

          /**
           * Trims the leading and trailing spaces of the string specified by <tt>str</tt>.
           * Uses the native trim function if available
           * @param {String} str The string to trim
           * @return {String} The new trimmed string
           */
          trim: function(str)  {
             if(nTrim)   {
                return nTrim.call(str);
             }
             return str.replace(/^\s+|\s+$/g, "");
          },
          parse_unescape_fields: function (obj) {
            var prop ="";
            if (typeof obj === "string") {
                obj = unescape(obj);
                return obj;
            } 
            for (prop in obj) {
                if (typeof obj[prop] === "object") this.parse_unescape_fields(obj[prop]);
                else if (typeof obj[prop] === "string") obj[prop] = unescape(obj[prop]);
            }
            return obj;
          },
          /**
           * Parses the specified text as JSON. Uses the JSON object if available
           * @param {String}  txt The json formatted string
           * @return {Object} The json object
           */
          parseJson: function(txt)   {
             if(typeof JSON !== "undefined") {
                if(txt === "undefined" || txt === "null") {
                    return undef;
                }
                var obj =  JSON.parse(txt);
                obj = this.parse_unescape_fields(obj);
                return obj;
             }else {
                var obj = new Function("return " + txt).call();
                return cleanJson(obj);
             }
          },

          /**
           * Iterates over the array (or arraylike or object) <tt>arr</tt> and calls the <tt>callback</tt>
           * for each iteration with the scope as <tt>thisObject</tt>. Uses the native forEach if its
           * available on the specified array or obejct.
           * @param {Object|Array} arr The array or object to iterate, if the object specified is an array
           * its elements are iterated, if the object is a "object" its values and keys are iterated
           * @param {Function} callback The callback function to call for each iteration. If an array is
           * iterated, the callback is called as <tt>callback(val, index, array)</tt> else the callback
           * is called as <tt>callback(value, key, obj)</tt>
           * @param {Object} thisObject An optional scope object that will be the value of "this" inside
           * the callback
           * @function
           */
          forEach: each,

          /**
           * Iterates over the array (or arraylike or object) <tt>arr</tt> and calls the <tt>callback</tt>
           * for each iteration with the scope as <tt>thisObject</tt> collecting or filtering objects for 
           * which the callback returns true. Uses the native <tt>Array.filter</tt> if its available on 
           * the specified array or obejct
           * @param {Object|Array} arr The array or object to iterate, if the object specified is an array
           * its elements are iterated, if the object is a "object" its values and keys are iterated
           * @param {Function} callback The callback function to call for each iteration. If an array is
           * iterated, the callback is called as <tt>callback(val, index, array)</tt> else the callback
           * is called as <tt>callback(value, key, obj)</tt>
           * @param {Object} thisObject An optional scope object that will be the value of "this" inside
           * the callback
           * @return An array of filtered objects
           * @function
           */
          filter: filter,

          /**
           * Determines whether the object <tt>that</tt> is a type of specific type. This compares the
           * objects [[Class]] with the specified type:
           * The various types are:
           * <ul>
           *    <li>String</li>
           *    <li>Number</li>
           *    <li>Boolean</li>
           *    <li>Date</li>
           *    <li>Error</li>
           *    <li>Array</li>
           *    <li>Function</li>
           *    <li>RegExp</li>
           *    <li>Object</li>
           * </ul>
           * 
           * @param {Object} that The object whose type is to be compared
           * @param {String} type One of the specified types
           * @return true if the object <tt>that</tt> is of specified type
           * @function
           */
          isTypeOf: isTypeOf,

          /**
           * Just a short-cut way to call <tt>isTypeOf(that, "Function")</tt>
           * @param {Object} that The object whose type is to be determined to be a function
           * @return true if the specified object is a function
           * @see isTypeOf(that, type)
           * @function
           */
          isFunction: function(that) {return isTypeOf(that, "Function");},

          /**
           * Gets the value of internal [[Class]] property of the object <tt>that</tt>
           * @param {Object} that The object whose type needs to be determined
           * @return {String} The value of internal type ([[Class]])
           * @see isTypeOf(that, type)
           * @function
           */
          getTypeOf: getTypeOf,

          /**
           * An Object that when returned from <tt>forEach</tt> and <tt>filter</tt> to break out of 
           * the loops
           */
          Break: Break
       };
    })(lite);



    /*
     * Ajax API exposed by namespace lite.net
     */
    (function(lite) {
       var noop = function() {}, 

       ajaxDefaults = {
          url: window.location.href,
          method: "GET",
          contentType: "application/x-www-form-urlencoded",
          async: true,
          data: null,
          dataType: "text",
          username: null,
          password: null,
          //timeout: -1,
          headers: {},
          onSuccess: noop,
          onError: noop
       }, 
       util = lite.util,

       // handlers to handle data of specific type (specified by options.dataType)
       dataHandlers = {
          xml: function(xhr)   {
             var doc = xhr.responseXML, root = doc.documentElement;
             if(root && root.nodeName === "parseerror")   {
                throw new Error("ParseError");
             }else {
                return doc;
             }
          }, 

          json: function(xhr)  {
             util.parseJson(xhr.responseText);
          },

          text: function(xhr)  {
             return xhr.responseText;
          }
       };


       function ajax(options) {
          var headers = options.headers, empty = function()  {},
             onSuccess = util.isFunction(options.onSuccess) ? options.onSuccess : empty,
             onReceiving = util.isFunction(options.onReceiving) ? options.onReceiving : empty,
             onError = util.isFunction(options.onError) ? options.onError : empty,

             onTimeout = util.isFunction(options.onTimeout) ? options.onTimeout : empty,
             timeout = options.timeout || 0,
             hasTimedOut = false,

             xhr;

          // copy the defaults that have not been overridden in options
          util.agument(options, ajaxDefaults);

          xhr = (window.XMLHttpRequest) ? new XMLHttpRequest() :
                (window.ActiveXObject) ? new ActiveXObject("Microsoft.XMLHTTP")
                : null;

          if(!xhr)   {
             throw new Error("xhr.unsupported");
          }

          // indicate in some way that ajax has started
          lite.event.dispatch(document, "ajaxstart", {xhr:xhr});

          // if a null username is passed, it pops up a dialog box in opera
          if(options.username) {
             xhr.open(options.method, options.url, options.async, options.username, options.password);
          }else {
             xhr.open(options.method, options.url, options.async);
          }

          // set request headers
          util.forEach(headers, function(val, key) {
             xhr.setRequestHeader(key, val);
          });

          // set the content type
          if(options.data)  {
             xhr.setRequestHeader("Content-Type", options.contentType);
          }

          // set that this was request with AJAX
          xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
          
          // check if timeout has been set.
          if(timeout && !isNaN(timeout)) {
              console.log("Timeout is set " + timeout)
              xhr.__timeoutId = window.setTimeout(function() {
                  hasTimedOut = true;
                  xhr.abort();
                  onTimeout(xhr);
              }, timeout);
          }

          xhr.onreadystatechange = function() {
             var rs = xhr.readyState, dataType = options.dataType, res, code, message, handler;
             switch(rs)  {
                case 2:
                   if(timeout) {
                       window.clearTimeout(xhr.__timeoutId);
                   }
                   break;
                case 3:
                   if(onReceiving)   {
                      try   {
                         res = xhr.responseText;
                      }catch(err) {
                         console.log(err.message || err);
                         res = "Receiving data...";
                      }
                      onReceiving(res, status);
                   }
                   break;
                case 4:
                   if(timeout && hasTimedOut) {
                       console.log("Ready state 4 after timeout.");
                       hasTimedOut = false;
                       break;
                   }
                    
                   lite.event.dispatch(document, "ajaxend", {xhr:xhr});
                   code = xhr.status;
                   message = xhr.statusText;

                   // check for HTTP errors
                   if(code >= 400 && onError) {
                      onError(xhr, code, message);
                   }

                   handler = dataHandlers[dataType] || function(xhr) {
                      return xhr.responseText;
                   };

                   try   {
                      res = handler(xhr);
                      onSuccess(res, code, xhr);
                   }catch(err1) {
                      console.log(err1.message || err1);
                      onError(xhr, code, err1.message);
                   }
                   break;
                default:
                   break;
             }
          };
          // send the request
          return xhr.send(options.data);
       }

       /**
        * @namespace Contains function for networking (ajax) 
        */
       lite.net = {
          /**
           * Sends an ajax request. All the details of the ajax request are specified in the options
           * @param {Object} options The options for this ajax request. This object literal
           * contains following properties and methods:<br />
           *
           * <pre style="color:#333;font-size:11px; font-family:'Lucida Console' 'Monospace';">
           * url         (String)     The url to make the ajax request    (window.location.href)
           * method      (String)     The HTTP method (GET|POST|HEAD)     ("GET")
           * contentType (String)     The content type of this request    ("application/x-www-form-urlencoded")
           * async       (boolean)    Whether to make an async request    (true)
           * data        (DOM|String) The data to send with request       (null)
           * dataType    (String)     The expected resultent dataType
           *                          ("xml"|"text"|"binary")             (null)
           * username    (String)     The username if required            (null)
           * password    (String)     The password if required            (null)
           * timeout     (Number)     The time in milliseconts to wait    (currently not used)
           *                          for response                        (-1 indefinite)
           * headers     (Object)     Various headers as key:value        ({})
           *
           * onSuccess   (function)   The (optional) handler to be called with successfull
           *                          completion of request. The handler is passed 3
           *                          parameters:
           *                          onSuccess(data, HTTP respnose code, HTTP response message)
           *
           * onError     (function)   The (optional) handler that is called when an error occurs during
           *                          ajax request. Called as onSuccess(xhr, code, message)
           * </pre>
           * @from http://code.google.com/p/jaf
           * @function
           */
          ajax: ajax,

          /**
           * Gets (Http GET) JSON from the specified url and sending <tt>data</tt> for the get request.
           * Calls the onSuccess handler on successfully receiving data.
           * Just a convenience way of writing:
           * @example
           * $.ajax({
           *    url: url, 
           *    data: data, 
           *    onSuccess: onSuccess, 
           *    dataType: "json"
           * });
           *
           * @param {String} url The url to get JSON from
           * @param {Object} data The data to send with the GET request
           * @param {Function} onSuccess The callback handler when data was successfully received
           */
          getJson: function(url, data, onSuccess) {
             return ajax({url: url, data: data, onSuccess: onSuccess, dataType: "json"});
          },

          /**
           * Overrides the default options used by lite.net.ajax with specified ones. The default options
           * are:
           * @example
           * var defaults = {
           *    url: window.location.href,
           *    method: "GET",
           *    contentType: "application/x-www-form-urlencoded",
           *    async: true,
           *    data: null,
           *    dataType: "text",
           *    username: null,
           *    password: null,
           *    timeout: -1,
           *    headers: {},
           *    onSuccess: noop, // empty function
           *    onError: noop // empty function
           * }
           *
           * @param {Object} options The options to override in default options
           */
          setDefaults: function(options) {
             util.agument(ajaxDefaults, options);
          }
       };
    })(lite);



    /*
     * Event related functions. Exports the namespace lite.event
     */
    (function(lite) {
       var handlers = {}, readyHandlers = [], addEventListener = document.addEventListener, readyDone,
       Util = lite.util;

       /**
        * Checks if an element is valid element
        */
       function elementValid(elem)   {
          var type;
          if(elem) {
             type = elem.nodeType;
             return (type === 1 || type === 9);
          }
          return false;
       }

        /**
         * Creates and initializes an event.
         * @param {String} type The type of the event e.g. mouseout, click, etc.
         * @param {Object} props The properties for the event. This can be an object that sets other properties
         * for this event or any string or any other object. If the props is an object, its properties are
         * assigned to the event object. If its a String or any other object, props is assigned to event.data
         * property.
         * @return the newly created and initialized (initEvent) event.    
         * @source https://github.com/naikus/h5
         */
        function createEvent(type, props) {
            var evt, data = props || {},
                prop,
                bubbles = data.bubbles === false ? false : true,
                cancelable = data.cancelable === false ? false : true;

            if(document.createEvent) {
                evt = document.createEvent("Events");
            }else if(document.createEventObject) {
                evt = document.createEventObject();
            }

            if(Util.isTypeOf(props, "Object")) {
                for(prop in data) {
                    if(prop !== "bubbles" && prop !== "cancelable") {
                    evt[prop] = data[prop];
                    }
                }
            }else {
                evt.data = props;
            }

            if(evt.initEvent) {
                evt.initEvent(type, bubbles, cancelable);
            }
            return evt;      
        }

       /**
        * Fixes the event object to normalize it accross various browsers
        * @param {Event} event The event object
        * @param {Element} element The element on which the event was/is fired
        */
       function fixEvent(event, element)   {
          var e = event || window.event, doc, docElem, body, scrollLeft, scrollTop;
          if(!e.stopPropagation)   {
             e.stopPropagation = function()  {e.cancelBubble = true;};
          }

          if(!e.preventDefault)   {
             e.preventDefault = function() {e.returnValue = false;};
          }

          if(typeof e.target === "undefined") {
             e.target = e.srcElement || element;
          }

          if(e.target.nodeType === 3 ) {
             e.target = e.target.parentNode;
          }

          if(!e.relatedTarget && e.fromElement)  {
             try   {
                e.relatedTarget = e.fromElement === e.target ? e.toElement : e.fromElement;
             }catch(err)   {
                console.log(err.message || err);
             }
          }

          if(!e.pageX && e.clientX)  {
             doc = (e.target.ownerDocument || document);
             docElem = doc.documentElement;
             body = doc.body;
             scrollLeft = (docElem && docElem.scrollLeft || body && body.scrollLeft || 0);
             scrollTop = (docElem && docElem.scrollTop || body && body.scrollTop || 0);            
             e.pageX = e.clientX + scrollLeft;
             e.pageY = e.clientY + scrollTop;
          }

          return e;
       }

       /**
        * Creates a wrapper function that is added as an event listener. Also stores it in the cache 
        * for later retrieval
        * @param {Element} el The element
        * @param {String} type The type of event e.g. 'click', 'mouseover'
        * @param {Function} handler The handler function that handles the event
        */
       function createDelegate(el, type, handler)   {
          var hid, h, e, existing;
          if(!handler.__hid) {
             hid = handler.__hid = Util.nextUniqueId();
          }

          existing = handlers[hid];
          // check for duplicate
          if(existing && existing.element === el && existing.evtType === type && existing.target === handler)   {
             return null;
          }

          h = function(evt) {
             e = fixEvent(evt, el);
             handler.call(el, e);
          };

          handlers[hid] = {
             target: handler,
             element: el,
             evtType: type,
             delegate: h
          };

          return h;
       }

       /**
        *
        * IEContentLoaded.js
        *
        * Author: Diego Perini (diego.perini@gmail.com) NWBOX S.r.l.
        * Summary: DOMContentLoaded emulation for IE browsers
        * Updated: 05/10/2007
        * License: GPL/CC
        * Version: TBD
        * 
        * @param {Window} w The wndow object
        * @param {Function} fn the callback function
        */
       function ieContentLoaded (w, fn) {
          var d = w.document, done = false,
          // only fire once
          init = function () {
             if (!done) {
                done = true;
                fn();
             }
          };
          // polling for no errors
          (function () {
             try {
                // throws errors until after ondocumentready
                d.documentElement.doScroll('left');
             } catch (e) {
                setTimeout(arguments.callee, 50);
                return;
             }
             // no errors, fire
             init();
          })();
          // trying to always fire before onload
          d.onreadystatechange = function() {
             if (d.readyState === 'complete') {
                d.onreadystatechange = null;
                init();
             }
          };
       }

       /**
        * @namespace The event related functions
        */
       lite.event = {
          /**
           * Adds the handler as an event listener to the specified event on <tt>element</tt>
           * @param {HTMLElement} element The element that will be the event target
           * @param {String} type The type of event e.g. "click", "mouseover", "keypress", etc.
           * @param {Function} handler The function that will be called when the specified event fires
           * on the target element
           * @see unbind(element, type, handler)
           */
          bind: function(element, type, handler) {
             if(!elementValid(element)) {
                return;
             }
             var delegate = createDelegate(element, type, handler);
             if(! delegate)   {
                return;
             }
             if(addEventListener)  {
                element.addEventListener(type, delegate, false);
             }else {
                element.attachEvent("on" + type, delegate);
             }
          },

          /**
           * Removes the handler as an event listener on the specified <tt>element</tt> of type <tt>type</tt>
           * @param {HTMLElement} element The element is the event target
           * @param {String} type The type of event e.g. "click", "mouseover", "keypress", etc.
           * @param {Function} handler The handler to remove that was previously added or bound
           * @see bind(element, type, handler)
           */
          unbind: function(element, type, handler)  {
             if(!elementValid(element)) {
                return;
             }
             var hid = handler.__hid, delegate, hData;
             // alert("hid: " + hid + "\nhandler: " + handler);         
             if(!hid) {
                return;
             }
             hData = handlers[hid];

             if(!hData)  {
                return;
             }

             if(hData.element === element && hData.evtType === type && hData.target === handler)   {
                delegate = hData.delegate;
                if(element.removeEventListener)  {
                   element.removeEventListener(type, delegate, false);
                }else {
                   element.detachEvent("on" + type, delegate);
                }
                // delete the handler
                delete handlers[hid];
             }
          },
          
          /**
           * Adds a callback to the ready event. Ready event is called (as much as possible) as soon as
           * DOM content is available and scripts have loaded, in most cases before window.onload
           * @param {Function} callback The callback function to call when "things" are ready
           */
          ready: function(callback) {
             readyHandlers.push(callback);
          },

          /**
           * Dispatches the specified event on the current selected element(s)
           * @param {String} elem The DOM element
           * @param {String} type The type of event "click", "mouseover", "mouseout", etc.
           * @param {Object} data The event data such as "button", "relatedTarget", etc for the event. If 
           * the data argument is not an object, its set into the property data.event
           * @source https://github.com/naikus/h5
           */
          dispatch: function(elem, type, data) {
             var evt = createEvent(type, data);
             if(elem.dispatchEvent) {
                elem.dispatchEvent(evt);
             }else if(elem.fireEvent) {
                try {
                    elem.fireEvent("on" + type, evt);
                }catch(e) {
                  console.log("Error firing event " + type + ": " + e.message);
                  var arrh = Util.filter(handlers, function(h, hid) {
                      return h.element === elem && h.evtType === type;
                  });
                  if(arrh.length) {
                     Util.forEach(arrh, function(h) {
                        h.call(elem, evt);
                     });
                  }
                }
             }
          }
       };

       function ready()  {
          if(! readyDone)  {
             readyDone = true;         
             // call ready handlers
             Util.forEach(readyHandlers, function(callback) {
                callback.call(window);
             });
          }
       }

       // call all ready events as soon as possible or DOM is available
       (function init() {
          var E, l;
          if(addEventListener) {
             l = function() {
                document.removeEventListener("DOMContentLoaded", l, false);
                ready();
             };
             document.addEventListener("DOMContentLoaded", l, false);

             // This is not allowed in strict mode, specifically, arguments.callee
             /*
             document.addEventListener("DOMContentLoaded", function() {
                document.removeEventListener("DOMContentLoaded", arguments.callee, false);
                ready();
             }, false);
             */
          }else if(document.attachEvent)   {
             ieContentLoaded(window, ready);
          }

          E = lite.event;
          // remove all event listeners in IE to prevent leaks
          if(window.attachEvent && !window.addEventListener) {
             window.attachEvent("onunload", function() {
                Util.forEach(handlers, function(hInfo, hid) {
                   // alert("unbinding: " + hInfo)
                   E.unbind(hInfo.element, hInfo.evtType, hInfo.target);
                });
             });
             handlers = {};
          }
       })();
    })(lite);



    /**
     * The lite.nodelist function is the entry point into most DOM querying
     */
    (function(lite) {
       var cssQuery, hasqsa = !!document.querySelectorAll, slice = Array.prototype.slice, util = lite.util,
       domApi, event = lite.event, gcs = window.getComputedStyle, 
       htmlRe = /^<[^>]+>/,
       isIe = !!window.ActiveXObject, // stupid check :/

       nt = {
          ELEMENT_NODE: 1,
          ATTRIBUTE_NODE: 2,
          TEXT_NODE: 3,
          CDATA_SECTION_NODE: 4,
          ENTITY_REFERENCE_NODE: 5,
          ENTITY_NODE: 6,
          PROCESSING_INSTRUCTION_NODE: 7,
          COMMENT_NODE: 8,
          DOCUMENT_NODE: 9,
          DOCUMENT_TYPE_NODE: 10,
          DOCUMENT_FRAGMENT_NODE: 11,
          NOTATION_NODE: 12
       };

       if(!hasqsa) {
          // Thankfully this is not evaluated in browsers that support strict mode since they have a
          // querySelectorAll function ;)
          /*
           * cssQuery, version 2.0.2 (2005-08-19)
           * Copyright: 2004-2005, Dean Edwards (http://dean.edwards.name/)
           * License: http://creativecommons.org/licenses/LGPL/2.1/
           */
          eval(function(p,a,c,k,e,d){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--)d[e(c)]=k[c]||e(c);k=[function(e){return d[e]}];e=function(){return'\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p}('7 x=6(){7 1D="2.0.2";7 C=/\\s*,\\s*/;7 x=6(s,A){33{7 m=[];7 u=1z.32.2c&&!A;7 b=(A)?(A.31==22)?A:[A]:[1g];7 1E=18(s).1l(C),i;9(i=0;i<1E.y;i++){s=1y(1E[i]);8(U&&s.Z(0,3).2b("")==" *#"){s=s.Z(2);A=24([],b,s[1])}1A A=b;7 j=0,t,f,a,c="";H(j<s.y){t=s[j++];f=s[j++];c+=t+f;a="";8(s[j]=="("){H(s[j++]!=")")a+=s[j];a=a.Z(0,-1);c+="("+a+")"}A=(u&&V[c])?V[c]:21(A,t,f,a);8(u)V[c]=A}m=m.30(A)}2a x.2d;5 m}2Z(e){x.2d=e;5[]}};x.1Z=6(){5"6 x() {\\n  [1D "+1D+"]\\n}"};7 V={};x.2c=L;x.2Y=6(s){8(s){s=1y(s).2b("");2a V[s]}1A V={}};7 29={};7 19=L;x.15=6(n,s){8(19)1i("s="+1U(s));29[n]=12 s()};x.2X=6(c){5 c?1i(c):o};7 D={};7 h={};7 q={P:/\\[([\\w-]+(\\|[\\w-]+)?)\\s*(\\W?=)?\\s*([^\\]]*)\\]/};7 T=[];D[" "]=6(r,f,t,n){7 e,i,j;9(i=0;i<f.y;i++){7 s=X(f[i],t,n);9(j=0;(e=s[j]);j++){8(M(e)&&14(e,n))r.z(e)}}};D["#"]=6(r,f,i){7 e,j;9(j=0;(e=f[j]);j++)8(e.B==i)r.z(e)};D["."]=6(r,f,c){c=12 1t("(^|\\\\s)"+c+"(\\\\s|$)");7 e,i;9(i=0;(e=f[i]);i++)8(c.l(e.1V))r.z(e)};D[":"]=6(r,f,p,a){7 t=h[p],e,i;8(t)9(i=0;(e=f[i]);i++)8(t(e,a))r.z(e)};h["2W"]=6(e){7 d=Q(e);8(d.1C)9(7 i=0;i<d.1C.y;i++){8(d.1C[i]==e)5 K}};h["2V"]=6(e){};7 M=6(e){5(e&&e.1c==1&&e.1f!="!")?e:23};7 16=6(e){H(e&&(e=e.2U)&&!M(e))28;5 e};7 G=6(e){H(e&&(e=e.2T)&&!M(e))28;5 e};7 1r=6(e){5 M(e.27)||G(e.27)};7 1P=6(e){5 M(e.26)||16(e.26)};7 1o=6(e){7 c=[];e=1r(e);H(e){c.z(e);e=G(e)}5 c};7 U=K;7 1h=6(e){7 d=Q(e);5(2S d.25=="2R")?/\\.1J$/i.l(d.2Q):2P(d.25=="2O 2N")};7 Q=6(e){5 e.2M||e.1g};7 X=6(e,t){5(t=="*"&&e.1B)?e.1B:e.X(t)};7 17=6(e,t,n){8(t=="*")5 M(e);8(!14(e,n))5 L;8(!1h(e))t=t.2L();5 e.1f==t};7 14=6(e,n){5!n||(n=="*")||(e.2K==n)};7 1e=6(e){5 e.1G};6 24(r,f,B){7 m,i,j;9(i=0;i<f.y;i++){8(m=f[i].1B.2J(B)){8(m.B==B)r.z(m);1A 8(m.y!=23){9(j=0;j<m.y;j++){8(m[j].B==B)r.z(m[j])}}}}5 r};8(![].z)22.2I.z=6(){9(7 i=0;i<1z.y;i++){o[o.y]=1z[i]}5 o.y};7 N=/\\|/;6 21(A,t,f,a){8(N.l(f)){f=f.1l(N);a=f[0];f=f[1]}7 r=[];8(D[t]){D[t](r,A,f,a)}5 r};7 S=/^[^\\s>+~]/;7 20=/[\\s#.:>+~()@]|[^\\s#.:>+~()@]+/g;6 1y(s){8(S.l(s))s=" "+s;5 s.P(20)||[]};7 W=/\\s*([\\s>+~(),]|^|$)\\s*/g;7 I=/([\\s>+~,]|[^(]\\+|^)([#.:@])/g;7 18=6(s){5 s.O(W,"$1").O(I,"$1*$2")};7 1u={1Z:6(){5"\'"},P:/^(\'[^\']*\')|("[^"]*")$/,l:6(s){5 o.P.l(s)},1S:6(s){5 o.l(s)?s:o+s+o},1Y:6(s){5 o.l(s)?s.Z(1,-1):s}};7 1s=6(t){5 1u.1Y(t)};7 E=/([\\/()[\\]?{}|*+-])/g;6 R(s){5 s.O(E,"\\\\$1")};x.15("1j-2H",6(){D[">"]=6(r,f,t,n){7 e,i,j;9(i=0;i<f.y;i++){7 s=1o(f[i]);9(j=0;(e=s[j]);j++)8(17(e,t,n))r.z(e)}};D["+"]=6(r,f,t,n){9(7 i=0;i<f.y;i++){7 e=G(f[i]);8(e&&17(e,t,n))r.z(e)}};D["@"]=6(r,f,a){7 t=T[a].l;7 e,i;9(i=0;(e=f[i]);i++)8(t(e))r.z(e)};h["2G-10"]=6(e){5!16(e)};h["1x"]=6(e,c){c=12 1t("^"+c,"i");H(e&&!e.13("1x"))e=e.1n;5 e&&c.l(e.13("1x"))};q.1X=/\\\\:/g;q.1w="@";q.J={};q.O=6(m,a,n,c,v){7 k=o.1w+m;8(!T[k]){a=o.1W(a,c||"",v||"");T[k]=a;T.z(a)}5 T[k].B};q.1Q=6(s){s=s.O(o.1X,"|");7 m;H(m=s.P(o.P)){7 r=o.O(m[0],m[1],m[2],m[3],m[4]);s=s.O(o.P,r)}5 s};q.1W=6(p,t,v){7 a={};a.B=o.1w+T.y;a.2F=p;t=o.J[t];t=t?t(o.13(p),1s(v)):L;a.l=12 2E("e","5 "+t);5 a};q.13=6(n){1d(n.2D()){F"B":5"e.B";F"2C":5"e.1V";F"9":5"e.2B";F"1T":8(U){5"1U((e.2A.P(/1T=\\\\1v?([^\\\\s\\\\1v]*)\\\\1v?/)||[])[1]||\'\')"}}5"e.13(\'"+n.O(N,":")+"\')"};q.J[""]=6(a){5 a};q.J["="]=6(a,v){5 a+"=="+1u.1S(v)};q.J["~="]=6(a,v){5"/(^| )"+R(v)+"( |$)/.l("+a+")"};q.J["|="]=6(a,v){5"/^"+R(v)+"(-|$)/.l("+a+")"};7 1R=18;18=6(s){5 1R(q.1Q(s))}});x.15("1j-2z",6(){D["~"]=6(r,f,t,n){7 e,i;9(i=0;(e=f[i]);i++){H(e=G(e)){8(17(e,t,n))r.z(e)}}};h["2y"]=6(e,t){t=12 1t(R(1s(t)));5 t.l(1e(e))};h["2x"]=6(e){5 e==Q(e).1H};h["2w"]=6(e){7 n,i;9(i=0;(n=e.1F[i]);i++){8(M(n)||n.1c==3)5 L}5 K};h["1N-10"]=6(e){5!G(e)};h["2v-10"]=6(e){e=e.1n;5 1r(e)==1P(e)};h["2u"]=6(e,s){7 n=x(s,Q(e));9(7 i=0;i<n.y;i++){8(n[i]==e)5 L}5 K};h["1O-10"]=6(e,a){5 1p(e,a,16)};h["1O-1N-10"]=6(e,a){5 1p(e,a,G)};h["2t"]=6(e){5 e.B==2s.2r.Z(1)};h["1M"]=6(e){5 e.1M};h["2q"]=6(e){5 e.1q===L};h["1q"]=6(e){5 e.1q};h["1L"]=6(e){5 e.1L};q.J["^="]=6(a,v){5"/^"+R(v)+"/.l("+a+")"};q.J["$="]=6(a,v){5"/"+R(v)+"$/.l("+a+")"};q.J["*="]=6(a,v){5"/"+R(v)+"/.l("+a+")"};6 1p(e,a,t){1d(a){F"n":5 K;F"2p":a="2n";1a;F"2o":a="2n+1"}7 1m=1o(e.1n);6 1k(i){7 i=(t==G)?1m.y-i:i-1;5 1m[i]==e};8(!Y(a))5 1k(a);a=a.1l("n");7 m=1K(a[0]);7 s=1K(a[1]);8((Y(m)||m==1)&&s==0)5 K;8(m==0&&!Y(s))5 1k(s);8(Y(s))s=0;7 c=1;H(e=t(e))c++;8(Y(m)||m==1)5(t==G)?(c<=s):(s>=c);5(c%m)==s}});x.15("1j-2m",6(){U=1i("L;/*@2l@8(@\\2k)U=K@2j@*/");8(!U){X=6(e,t,n){5 n?e.2i("*",t):e.X(t)};14=6(e,n){5!n||(n=="*")||(e.2h==n)};1h=1g.1I?6(e){5/1J/i.l(Q(e).1I)}:6(e){5 Q(e).1H.1f!="2g"};1e=6(e){5 e.2f||e.1G||1b(e)};6 1b(e){7 t="",n,i;9(i=0;(n=e.1F[i]);i++){1d(n.1c){F 11:F 1:t+=1b(n);1a;F 3:t+=n.2e;1a}}5 t}}});19=K;5 x}();',62,190,'|||||return|function|var|if|for||||||||pseudoClasses||||test|||this||AttributeSelector|||||||cssQuery|length|push|fr|id||selectors||case|nextElementSibling|while||tests|true|false|thisElement||replace|match|getDocument|regEscape||attributeSelectors|isMSIE|cache||getElementsByTagName|isNaN|slice|child||new|getAttribute|compareNamespace|addModule|previousElementSibling|compareTagName|parseSelector|loaded|break|_0|nodeType|switch|getTextContent|tagName|document|isXML|eval|css|_1|split|ch|parentNode|childElements|nthChild|disabled|firstElementChild|getText|RegExp|Quote|x22|PREFIX|lang|_2|arguments|else|all|links|version|se|childNodes|innerText|documentElement|contentType|xml|parseInt|indeterminate|checked|last|nth|lastElementChild|parse|_3|add|href|String|className|create|NS_IE|remove|toString|ST|select|Array|null|_4|mimeType|lastChild|firstChild|continue|modules|delete|join|caching|error|nodeValue|textContent|HTML|prefix|getElementsByTagNameNS|end|x5fwin32|cc_on|standard||odd|even|enabled|hash|location|target|not|only|empty|root|contains|level3|outerHTML|htmlFor|class|toLowerCase|Function|name|first|level2|prototype|item|scopeName|toUpperCase|ownerDocument|Document|XML|Boolean|URL|unknown|typeof|nextSibling|previousSibling|visited|link|valueOf|clearCache|catch|concat|constructor|callee|try'.split('|'),0,{}));
       }
       
       function removeAllDom(elem) {
          // In a few cases in IE, the innerHTML of a table is a read only property
          // thats why we have to use dom
          var child = elem.firstChild;
          while(child)   {
             elem.removeChild(child);
             child = elem.firstChild;
          }
          return elem;
       }

       /**
        * In some older browsers like IE6 slice.call on NodeList fails, hence this wrapper :)
        */
       function sliceList(arrayLike)  {
          var arr, i, len;
          if(util.isTypeOf(arrayLike, "Array")) {
             arr = slice.call(arrayLike);
          }else {
             arr = [];
             for(i = 0, len =  arrayLike.length; i < len; i++) {
                arr[arr.length] = arrayLike[i];
             }
          }
          return arr;
       }
       
       function removeAll(elem, useDom)   {
          if(useDom) {
             return removeAllDom(elem);
          }
          try {
             elem.innerHTML = "";
          }catch(e) {
             return removeAllDom(elem);
          }
          return elem;
       }

       /**
        * Internal method to create a nodelist quickly. 
        * Do not use this methods to create table related nodes
        */
       function fragments(html) {
          var div = document.createElement("div"), arr;
          div.innerHTML = html;         
          arr = sliceList(div.childNodes);
          removeAll(div, isIe);
          return arr;
       }

       /**
        * Converts the <tt>html</tt> which can be an HTML string, a nodelist or a node, then passes the
        * converted html and the specified <tt>element</tt> to the callback as:
        * <tt>callback(element, arrnodesFromhtml)</tt>.
        * The idea is borrowed from turing.js framework (https://github.com/alexyoung/turing.js) but with
        * some modifications. If the element is a table element, then the callback is passed a tbody, if
        * present or the table element
        */
       function domify(element, html, callback)  {
          var nodeName = element.nodeName.toLowerCase(), 
          isTable = (nodeName === "table" || nodeName === "tbody" || nodeName === "thead" || nodeName === "tfoot"), 
          div, cbElem, tbody, 
          frags, doc = element.ownerDocument;
          
          if(html.nodeName) {
             frags = [html];
          }else if(html.elements) {
             frags = html.elements; // lite object
          }else if(html.item && html.length) {
             frags = html; // DOM nodelist
          }else {
             if(isTable) {
                nodeName = "table";
             }
             div = doc.createElement("div");
             div.innerHTML = ["<", nodeName, ">", html, "</", nodeName, ">"].join("");
             
             frags = isTable ? div.firstChild.firstChild.childNodes : div.firstChild.childNodes;
          }
          // if its table, pass in the tbody, else pass in the element
          tbody = element.getElementsByTagName("tbody")[0] || element;
          cbElem = isTable ? tbody : element;      
          callback(cbElem, sliceList(frags));
       }

       function validElem(elem)   {
          return elem && elem.nodeType === nt.ELEMENT_NODE;
       }

       domApi = {
          setHtml: function(elem, html)  {
             var t = util.getTypeOf(html);
             if(t === "String" || t === "Number") {
                try {
                   elem.innerHTML = html;
                }catch(e)   {
                   domApi.replace(elem, html);
                }
             }else {
                domApi.replace(elem, html);
             }
          },

          append: function(elem, html) {
             domify(elem, html, function(appendTo, arrNodes) {
                util.forEach(arrNodes, function(node) {
                   appendTo.appendChild(node);
                });
             });
          },

          prepend: function(elem, html) {
            domify(elem, html, function(theElem, arrNodes) {
               var child, node, i;
               // while prepending, go backwards to maintain order :)
               for(i = arrNodes.length - 1; i >= 0; i--) {
                  child = theElem.firstChild;
                  node = arrNodes[i];
                  if(child)  { 
                     theElem.insertBefore(node, child);
                  }else {
                     theElem.appendChild(node);
                  }
               }
            });
          },

          replace: function(elem, html) {
             domify(elem, html, function(appendTo, arrNodes) {
                appendTo = removeAll(appendTo);
                // domApi.append(appendTo, arrNodes);
                util.forEach(arrNodes, function(node) {
                   appendTo.appendChild(node);
                });
             });
          },

          findElements: function(selector, context) {
             if(hasqsa) {
                return (context || document).querySelectorAll(selector);
             }else {
                return cssQuery(selector, context || document);
             }
          },

          hasClass: function(elem, clName) {
             var cList, arr, i, len;

             if(!validElem(elem)) {
                return false;
             }
             // check for HTML5 element.classList (DOMTokenList)
             cList = elem.classList;
             if(cList) {
                return cList.contains(clName);
             }

             arr = (elem.className || "").split(" ");
             for(i = 0, len = arr.length; i < len && arr[i] !== clName; i++){}
             return i < arr.length;
          },

          addClass: function(elem, clName)  {
             if(!clName) {
                return;
             }
             if(validElem(elem))  {
                var cList = elem.classList;
                if(cList) {
                   cList.add(clName);
                   return;
                }
                if(!domApi.hasClass(elem, clName))  {
                   elem.className += " " + clName;
                }
             }
          },

          removeClass: function(elem, clName) {
             var cList, strClasses, classes, updatedCls;

             if(validElem(elem))  {
                cList = elem.classList;
                if(cList) {
                   cList.remove(clName);
                   return;
                }

                strClasses = (elem.className || "");
                if(strClasses.indexOf(clName) !== -1)   {
                   classes = strClasses.split(" ");
                   updatedCls = util.filter(classes, function(val, idx) {
                      return val !== clName;
                   });
                   elem.className = updatedCls.join(" ");
                }
             }
          },

          data: function(elem, prop, val) {
             var arglen = arguments.length, dmap = elem.datamap;
             if(!dmap) {
                elem.datamap = dmap = {};
             }

             if(arglen === 1)  {
                return dmap;
             }else if(arglen === 2) {
                return dmap[prop];
             }else {
                dmap = elem.datamap = elem.datamap || {};
                dmap[prop] = val;
                return null;
             }
          },

          getStyle: function(elem, prop)   {
             var cs;
             if(gcs)  {
                cs = gcs(elem, null);
             }else {
                cs = elem.currentStyle;
             }
             return cs[prop];
          },

          setStyle: function(elem, props) {
             var style = elem.style;         
             util.forEach(props, function(val, key) {
                // try {
                  style[key] = val;
                /*
                }catch(e) {
                  console.log("Error setting style property '" + key + "' on " + elem.tagName);
                }
                */
             });
          },
          
          getOffsets: function(elem)  {
             var o = {
                left: elem.offsetLeft, 
                top: elem.offsetTop,
                width: elem.offsetWidth,
                height: elem.offsetHeight
             },
             par = elem.offsetParent;

             while(par)  {
                o.left += par.offsetLeft;
                o.top += par.offsetTop;
                par = par.offsetParent;
             }
             return o;
          }
       };

       // export our dom api
       // lite.dom = domApi;

       /**
        * The main $ function. This the entry point for DOM querying
        * @param {String|Node|HTML|NodeList|ArrayOfNodes} sel The CSS selector for the element(s) to match
        * @param {Node|nodelist} ctx The context object for querying
        * @return {lite.nodelist} The lite.nodelist object that can be further used for querying and manipulating
        * DOM via chaining
        * 
        * @namespace 
        */
       lite.nodelist = function nodelist(sel, ctx) {
          // var me = arguments.callee, // not allowed in strict mode use me = nodelist 
          var me = nodelist, selector = "",
          context = ctx ? ctx.elements ? ctx.elements[0] : ctx : null, els,
          elements;
          /* used by SlideUp and SlideDown */
          var slide_speed = {
            slow:600,
            fast:200,
            _default:400,
            get: function(val)   {
                var _speed = this[val];
                if (_speed == undefined) {
                    var check_int = parseInt(val);
                    _speed = isNaN(check_int) ? this._default : _speed = val;
                }
                return _speed;
            }
          };
          
          function getElements(s, c)   {
             var ret = {
                e: [],
                s: ""
             };

             if(! s) {
                return ret;
             }else if(util.isTypeOf(s, "String"))  {
                if(htmlRe.test(s)) {
                   ret.e = fragments(s);
                }else {
                   // for some reason IE does not like calling slice on nodelist
                   ret.e = sliceList(domApi.findElements(s, c));
                   ret.s = s;
                }
             }else if(s.elements) {
                ret.e = s.elements;
                ret.s = s.selector;
             }else if(s.nodeName) {
                ret.e = [s];
             }else {
                ret.e = sliceList(s);
             }
             return ret;
          }

          els = getElements(sel, context);
          elements = els.e;
          selector = els.s;
          return {
             /**
              * All the elements in this nodelist
              * @memberOf lite.nodelist
              */
             elements: elements,

             selector: selector,

             /**
              * Gets the element at the specified index in this nodelist
              * @param {Number} idx The index of the element to get
              * @return {Node} The element or node at the specified index or null
              *
              * @memberOf lite.nodelist
              */
             get: function(idx)   {
                return elements[idx];
             },

             count: function() {
                return elements ? elements.length : 0;
             },

             /**
              * Gets or sets the html string as inner html to all the elements in the current matched 
              * elements. If call without arguments, returns the html contents of the first element in
              * current matched elements.
              * @param {String} markup The html to set (Optional)
              * @return {String} The html contents of the matched element if called without any arguments
              * or the nodelist objec for chaining
              *
              * @memberOf lite.nodelist
              */
             html: function(markup)  {
                if(arguments.length === 0) {
                   return elements.length === 0 ? null : elements[0].innerHTML;
                }
                markup = typeof markup === "undefined" || markup === null ? "" : markup + ""; 
                util.forEach(elements, function(el) {
                   domApi.setHtml(el, markup);
                });
                return this;
             },

             /**
              * Gets or sets an attribute of the matched element(s). If <tt>value</tt> is specified, 
              * the attribute is set with that value, else the value of the attribute is returned
              * @param {String} name The attribute name
              * @param {String} value The value to set
              * @return {String} the value of the attribute if called with <tt>name</tt> else the nodelist
              * for chaining
              *
              * @memberOf lite.nodelist
              */
             attr: function(name, value)   {
                var n = name === "class" ? "className" : name, elem;

                if(elements.length === 0)  {
                   return null;
                }
                elem = elements[0];
                if(arguments.length === 1) {
                   return elem.getAttribute(name) || elem[n];
                }else {
                   elem.setAttribute(name, value);
                   return this;
                }
             },
             
             removeAttr: function(name) {
                var elem;
                if(elements.length === 0) {
                   return this;
                }
                util.forEach(elements, function(elem) {
                   elem.removeAttribute(name);
                });
                return this;
             },

             /**
              * Gets or sets the value of a form element (the "value" attribute). If called with 1 argument,
              * the value is set or else the value is retrieved
              * @param {String} theVal The value to set
              * @return {String} The value of the input or form field if called without any arguments else 
              * the nodelist object for chaining
              *
              * @memberOf lite.nodelist
              */
             val: function(theVal)   {
                var n, opts, vals, opv, el, ret;
                if(elements.length === 0) {
                   return this;
                }

                if(arguments.length === 1) {
                   util.forEach(elements, function(elem) {
                       n = elem.nodeName.toLowerCase();
                       if(n === "select") {
                          opts = me("option", elem).elements;
                          vals = util.isTypeOf(theVal, "Array") ? theVal : [theVal];

                          util.forEach(vals, function(val) {
                             util.forEach(opts, function(opt, index) {
                                opv = opt.value || opt.innerHTML;
                                if(opv === val) {
                                   opt.selected = "selected";
                                   elem.selectedIndex = index;
                                   elem.value = val;
                                   return util.Break;
                                }
                                return null;
                             });
                          });
                       }else {
                         elem.value = theVal;
                       }
                   });
                   return this;
                }else {
                   el = elements[0];
                   n = el.nodeName.toLowerCase();
                   if(n === "select") {
                      ret = [];
                      opts = me("option", el).elements;
                      util.forEach(opts, function(opt) {
                         if(opt.selected) {
                            opv = opt.value || opt.innerHTML;
                            ret[ret.length] = opv;
                         }
                      });

                      return ret.length === 0 ? "" : ret.length == 1 ? ret[0] : ret;
                   }else {
                      return el.value;
                   }
                }
             },

             /**
              * Set the option by its index in a select element
              * @param {integer} index of the option
              * @memberOf lite.nodelist
              */
             selected: function(idx)   {
                if(elements.length === 0) {
                   return this;
                }
                elements[0].options[idx].selected ='true';
            },

             /**
              * Gets or sets the custom data on matched element(s). Uses HTML5 datasets if available
              * @param {String} name The name of data property
              * @param {Object} value The value of the property
              * @return {Object} The value of the property if called with ony 1 argument else the nodelist
              * object for chaining
              *
              * @memberOf lite.nodelist
              */
             data: function(name, value)   {
                if(elements.length === 0)  {
                   return null;
                }
                var len = arguments.length;
                if(len === 1)  {
                   return domApi.data(elements[0], name);
                }else {
                   util.forEach(elements, function(elem) {
                      domApi.data(elem, name, value);
                   });
                }
                return this;
             },

             /**
              * Appends the html content (node, or html string) to the first matching element.
              * @param {String|Node} html The html content to append
              * @return {Object} the same nodelist for chaining
              */
             append: function(html)  {
                if(! html || elements.length === 0) {return this;}
                domApi.append(elements[0], html); 
                return this;
             },

             /**
              * Prepends the html to the first matching element in this context (nodelist)
              * @param {String|Node} html The html content to prepend (insertbefore)
              * @return {Object} the nodelist object for chaining
              */
             prepend: function(html) {
                if(! html || elements.length === 0) {return this;}
                domApi.prepend(elements[0], html); 
                return this;
             },
             
             replace: function(html) {
                if(! html || elements.length === 0) {return this;}
                util.forEach(elements, function(e) {
                    domApi.replace(e, html); 
                });
                return this;
             },

             /**
              * Removes all the elements matching the selector from this context (nodelist)
              * @param {String|Node|HTML|NodeList|ArrayOfNodes} selector The CSS selector for the element(s) 
              * to match
              * @example
              * // Given element 
              * &lt;p id="bar" class="foo baz"&gt;Hello &lt;span&gt;stupid&lt;/span&gt; world&lt;/p&gt;
              * $("#bar").remove("span");
              * // will result in
              * &lt;p id="bar" class="foo baz"&gt;Hello world&lt;/p&gt;
              */
             remove: function(selector)  {
                var elems, elem, c;
                if(elements.length === 0)  {
                   return this;
                }

                c = elements[0];
                elems = me(selector, c).elements;
                util.forEach(elems, function(elem) {
                   c.removeChild(elem);
                });
                return this;
             },

             /**
              * Finds the element(s) matching the specified selector within the context of the current
              * element (this can be null, then it works just like $(...))
              * @param {String} selector The selector of the elements to find
              * @return {Object} the $ object matched for chaining
              * @example
              * var pees = $("#foo").find("p"); // finds all the "p" elements under the element with id "foo"
              * // This finds the span element in element in the html and sets its content to stupid
              * $("&lt;p id="bar" class="foo baz"&gt;Hello &lt;span&gt;cruel&lt;/span&gt; world&lt;/p&gt;").find("span").html("stupid");
              * // Will result in 
              * &lt;p id="bar" class="foo baz"&gt;Hello &lt;span&gt;stupid&lt;/span&gt; world&lt;/p&gt;
              */
             find: function(selector)   {
                if(util.getTypeOf(selector) !== "String") {
                   return selector;
                }
                return elements.length === 0 ? me(selector) : me(selector, elements[0]);
             },
             
             children: function(selector) {
                var empty = [], ret, thisElem;
                if(elements.length === 0) {
                   return empty;
                }
                if(util.getTypeOf(selector) !== "String") {
                   return empty;
                }
                
                thisElem = elements[0];
                ret = me(selector, thisElem);
                return util.filter(ret.elements, function(el) {
                   return el.parentNode === thisElem;
                });
             },

             /**
              * Determines whether the current matched element has the specified class in its className
              * @param {String} cl The class name to check
              * @return true if the current element has the specified class
              * @example
              * // given element
              * &lt;p id="mypara" class="para info"&gt;Hello&lt;/p&gt;
              * // this returns true
              * $("#mypara").hasClass(info); // true
              */
             hasClass: function(cl) {
                if(elements.length === 0) {
                   return false;
                }
                return domApi.hasClass(elements[0], cl);
             },

             /**
              * Adds a CSS class <tt>cl</tt> to the current matched element
              * @param {String} cl The class to add
              * @return {Object} The nodelist object for chaining
              * @example
              * // Given the element
              * &lt;p id="mypara" class="foo baz"&gt;Hello&lt;/p&gt;
              * $("#mypara").addClass("bar") 
              * // will result in 
              * &lt;p id="mypara" class="foo baz bar"&gt;Hello&lt;/p&gt;
              */
             addClass: function(cl)  {
                if(elements.length === 0) {
                   return this;
                }
                util.forEach(elements, function(el) {
                   domApi.addClass(el, cl);
                });
                return this;
             },

             /**
              * Removes a class <tt>cl</tt> from the current matched element's className
              * @param {String} cl The class to remove
              * @return {Object} The nodelist object for chaining
              * @example
              * // Given the element
              * &lt;p id="mypara" class="foo bar baz"&gt;Hello&lt;/p&gt;
              * $("#mypara").removeClass("bar") 
              * // will result in 
              * &lt;p id="mypara" class="foo baz"&gt;Hello&lt;/p&gt;
              */
             removeClass: function(cl)  {
                if(elements.length === 0) {
                   return this;
                }
                util.forEach(elements, function(el) {
                   domApi.removeClass(el, cl);
                });
                return this;
             },

             /**
              * Gets the value of the current or computed style property <tt>prop</tt> of the currently 
              * matched element
              * @param {String} The style property whose value is desired
              * @return {String} the value of the specified property or blank string
              * @example 
              * // Gets the background-color property of the element with id "foo"
              * var bgcolor = $("#foo").getStyle("background-color");
              */
             getStyle: function(prop)   {
                return elements.length === 0 ? "" : domApi.getStyle(elements[0], prop);
             },

             /**
              * Sets the css style properties <tt>props</tt> for all the matched elements
              * @param {Object} props The style properties to set
              * @return {Object} the nodelist object chaining
              * @example
              * // This will set the border and background-color style properties all input elements
              * $("input").setStyle({
              *    "background-color": "#666",
              *    "border": "1px solid #333"
              * });
              */
             setStyle: function(props)  {
                util.forEach(elements, function(el) {
                   domApi.setStyle(el, props);
                });
                return this;
             },
             
             css: function(prop, val) {
                 var style;
                 if(util.getTypeOf(prop) === "Object") {
                     style = [];
                     util.forEach(prop, function(v, k) {
                         style[style.length] = k + ":" + v;
                     });
                     style = style.join(";");
                 }else {
                    style = prop + ":" + val;
                 }
 
                 util.forEach(elements, function(elem) {
                     var s = elem.style, oldCss = s.cssText;
                     if(oldCss) {
                         s.cssText = oldCss + ";" + style;
                     }else {
                         s.cssText = style;
                     }
                 });
                 return this;
             },
            /**
             * Get the speed (in ms) and create an animation to slide the object from its current value to 0
             * cb is called at the end of the animation
             */
            slideUp: function(speed, cb) {
                 var _speed = slide_speed.get(speed);
                 /* allow us to get height of object */
                 util.forEach(elements, function (elm) {
                     domApi.setStyle(elm, {"display": "block", "visibility": "hidden", "height": "auto"});
                     var _visibleHeight = domApi.getStyle(elm, "height").split('px')[0];
                     /* Mandatory for IE7/8 */
                     if( _visibleHeight == "auto"){
                         _visibleHeight = elm.clientHeight;
                     }
                     domApi.setStyle(elm, {"height": "0px"});
                     domApi.setStyle(elm, {"display": "block", "visibility": "visible", "overflow": "hidden"});
                     morpheus(elm, {
                                        duration:_speed, 
                                        height: _visibleHeight,
                                        complete: function () { 
                                            domApi.setStyle(elm, {"height": "auto"});
                                        }
                    });
                 });
                morpheus({}, { duration:_speed, complete: cb});
                 return this;
             },
            /**
             * Get the speed (in ms) and create an animation to slide the object height from 0 to its height value
             * cb is called at the end of the animation
             */            
             slideDown: function(speed, cb, visibility) {
                if ( typeof visibility == "undefined") {
                    visibility= "visible";
                }
                var _speed = slide_speed.get(speed);
                util.forEach(elements, function (elm) {
                    var _visibleHeight = domApi.getStyle(elm, "height");
                     /* Mandatory for IE7/8 */
                    if( _visibleHeight == "auto"){
                        _visibleHeight = elm.clientHeight;
                     }
                    domApi.setStyle(elm,{
                        "display": "block", 
                        "visibility": visibility, 
                        "overflow": "hidden",
                        "height" : _visibleHeight
                    });
                    morpheus(elm, { 
                                    duration:_speed, 
                                    height: "0px"
                                    });
                });
                morpheus({}, { duration:_speed, complete: cb});
                return this;
             },

             /**
              * Gets the offset {top,letf,width,height} of the currently matched element
              * @return {Object} the offset object with properties top, left, width, height for the
              * currently matched element or null, if no matched elements exist.
              * @example
              * // This alert the actual offsets of the element with id "myelem"
              * var o = $("#myelem").offsets();
              * alert(["top: ", o.top, ", left: ", o.left, ", width: ", o.width, ", height: ", o.height].join(""));
              */
             offsets: function() {
               return elements.length === 0 ? null : domApi.getOffsets(elements[0]);
             },

             /**
              * Binds an a function <tt>callback</tt> with the event <tt>eType</tt> for all the matched
              * elements
              * @param {String} eType the event to bind to. e.g. "click", "mouseover", etc.
              * @param {Function} callback The function to call when the event happens
              * 
              * @example
              * // This will bind all the "p" elements in the document such that an alert will be
              * // displayed when clicked.
              * $("p").bind("click", function(e) {
              *    alert("Hello p");
              * });
              */
             bind: function(eType, callback)   {
                util.forEach(elements, function(el) {
                   event.bind(el, eType, callback);
                });
                return this;
             },

             /**
              * Unbinds a listener for an event that was previously bound via a <tt>bind</tt> call
              * @param {String} eType The event type e.g. "click", "mouseover", etc.
              * @param {Function} callback The bound listener to remvove
              */
             unbind: function(eType, callback) {
                util.forEach(elements, function(el) {
                   event.unbind(el, eType, callback);
                });
                return this;
             },
             
             dispatch: function(type, data) {
                 util.forEach(elements, function(el) {
                     event.dispatch(el, type, data);
                 });
             }
             
          };
       };
    })(lite);



    /**
     * Widget API
     */
    (function(lite) {
       function widget(name, widgetFunction)   {
          var existing = lite[name];
          if(existing)  {
             console.log("Warning! Widget " + widget + " is already defined");
          }

          lite[name] = function(selector, options) {
             var $ = lite.nodelist(selector);
             return widgetFunction.call($, options);
          };
       }
       lite.widget = widget;
    })(lite);
    
    /**
     * Plugin API
     */
    (function($) {
       function plugin(name, pluginFunction) {
          var existing = $[name];
          if(existing) {
             console.log("Warning! Plugin " + name + " is already defined");
          }
          $[name] = function(options) {
             return pluginFunction.call($, options);
          };
       }
       lite.plugin = plugin;
    })(lite);

})(this);








/* ------------------------------------------------ Lite plugins and Widgets ---------------------------------------- */
/**
 * A simple templating mechanism for creating string templates. A template has replacement tokens
 * that are of the format '{' followed by anystring followed by '}'. e.g The template below has
 * two replacement tokens: username and password
 * <p> Hello {username}. Your password is {password} </p>
 * (http://code.google.com/p/jaf)
 * @author aniket
 */
lite.template = (function(){
   var regExp = new RegExp("\\{([^\\{\\}]+)\\}", "g");
   
   /** 
    * Internally compiles the template into a function so that we don't need to
    * search the string for replacement for every call to process() function
    */
   function compile(templateStr) {
      var match = regExp.exec(templateStr), allParts = [], tmp = templateStr, lastIndex = 0;
      while(match !== null)   {
         tmp = templateStr.substring(lastIndex, match.index);
         
         allParts.push(tmp);
         allParts.push(match);
         lastIndex = regExp.lastIndex;
         match = regExp.exec(templateStr);
      }
      // if there is any trailing string
      if(lastIndex < templateStr.length) {
         allParts.push(templateStr.substring(lastIndex));
      }

      return function(objMap, keepMissingKeys) {
         objMap = objMap || {};
         var str = [], val = "", i, len, part;
         
         for(i = 0, len = allParts.length; i < len; i++)  {
            part = allParts[i];            
            if(typeof(part) === "string")   {
               str.push(part);
            }else   {
               val = objMap[part[1]] || (keepMissingKeys ? part[0] : "");
               str.push(val);
            }
         }         
         return str.join("");
      };
   }
   
   function Template(text) {
      /* The original template string */
      var templateStr = text,
      /* The object we store the values for tokens */
      keyMap = {},
      templateFunc = compile(text),
      util = lite.util;
      
      function process(objMap, keepMissingKeys) {
         util.agument(objMap, keyMap);
         return templateFunc(objMap, keepMissingKeys);
      }
      
      return {
         /**
          * Put a value for a given token in this template
          * @param {String} key The token key as it appears in the template
          * @param {String} value The value of the token
          */
         put: function(key, value) {
            keyMap[key] = value;
            return this;
         },
         
         /**
          * Process this template. The values in the optional passed map will override those that were
          * put by the put(String, String) function of this template
          * @param {Object} objMap The object containing tokens and their values as properties
          * @param {boolean} keepMissingKeys Keep key strings in template as they are if the keys are missing
          * in the variable map
          * @return The process template with token replaced by values. The tokens for which values
          * were not provided will be present in the returned string as is.
          */
         process: process,
         
         clear: function() {
            keyMap = {};
         },
   
         processWithFields: function(fields, keepMissingKeys) {
            var objMap = {}, f = null, i, len, fName;
            for(i = 0, len = fields.length; i < len; i++)  {
               fName = fields[i];
               f = document.getElementById(fName);
               if(f) {
                  objMap[fName] = f.value;
               }
            }
            return this.process(objMap, keepMissingKeys);
         }
      };
   }
   return Template;
})();


/**
 * The DataList widget. Creates a selectable list from the specified data
 * @Usage 
 * $.DataList("selector", options)
 * The options object takes the following:
 * values:
 * {
 *    listClass: css class for list, default "list",
 *    itemClass: css class for list item, default "list-item",
 *    data: The data array, default empty array
 *    render: A function to render list item "function(list-widget, current-dom-lite-item, index, datum)"
 *    onselectionchange: a handler function called when list selection changes
 * }
 * @author aniket
 */
(function($) {
   var defaults = {
      listClass: "list",
      itemClass: "list-item",
      data: [],
      render: function(list, item, idx, datum) {
         return "" + datum + "";
      },
      onselectionchange: function() {}
   },
   util = $.util;
   
   $.widget("DataList", function(options) {
      // these are our final options
      var opts = util.agument(options, defaults),
      // copy the data array
      data = opts.data.slice(0), 
      selectedItem, allItems,
      // our root element, create it if not present
      listRoot,
      enabled = true,
      self = this,
      element = this.get(0), 
      ul, widget;
      
      if(element.tagName.toLowerCase() === "ul")  {
         listRoot = this;
      }else {
         ul = document.createElement("ul");
         this.append(ul);
         listRoot = $(ul);
      }
      listRoot.addClass(opts.listClass);
      
      function fireSelectionChanged(item)  {
         var old = null, ret;
         if(selectedItem)  {
            old = selectedItem;
            if(selectedItem === item)  {
               return;
            }
         }
         
         selectedItem = item; // this is needed so that onselection change handlers can
                              // can call this.getSelectedItem
         ret = opts.onselectionchange.call(widget, item, old);
         if(ret !== false) {
            if(old) {
               old.removeClass("selected");
            }
            selectedItem = item;
            selectedItem.addClass("selected");
         }else {
            selectedItem = old;
         }
      }
            
      // function to render items
      function renderItem(objItem, itemIdx)  {
         var item = $(document.createElement("li")), content;

         // item.dataset = item.dataset || {};
         // item.dataset.model = objItem;
         item.data("model", objItem);
         item.data("index", itemIdx);
         
         if(opts.itemClass)   {
            item.addClass(opts.itemClass);
         }
         
         item.attr("id", util.nextUniqueId());

         content = opts.render(widget, item, itemIdx, objItem);

         // check if the renderer has already appended
         if(item.html() === "") {
            if(util.isTypeOf(content, "String"))   {
               item.html(content);
            }else {
               item.append(content);
            }
         }

         item.bind("click", function() {
            if(enabled) {
               fireSelectionChanged(item);
            }
         });
         
         return item;
      }
      
      function render() {
         allItems = [];
         // @TODO remove all event listeners before removing items
         listRoot.html("");
         
         if(data && data.length > 0)   {
            var items = document.createDocumentFragment();
            util.forEach(data, function(datum, i) {               
               var $li = renderItem(datum, i);
               items.appendChild($li.get(0));
               allItems.push($li);
            });
            listRoot.append(items);
         }
      }
      
      // our public API that is exposed to the widget
      widget = {
         $: self,
         getElement: function() {
            return listRoot;
         },
         
         setItems: function(itemData) {
            listRoot.html("");
            data = itemData || [];
            // itemMap = {};
            selectedItem = null;
            render();
         },
         
         setEnabled: function(bEnabled)  {
            enabled = bEnabled === false ? false : true;
            if(enabled) {
               listRoot.removeClass("disabled");
            }else {
               listRoot.addClass("disabled");
            }
         },
         
         getItems: function() {
            return data.slice(0);
         },

         getSelectedItem: function() {
            return selectedItem;
         },
         
         getSelectedIndex: function() {
             if(!selectedItem) {
                 return -1;
             }
             var indx;
             util.forEach(allItems, function(item, i) {
                 if(item === selectedItem) {
                     indx = i;
                     return util.Break;
                 }
                 return null;
             });
             return indx;
         },

         selectItemAt: function(idx)   {
            var len = allItems.length;
            if(idx < len && idx >= 0)  {
               fireSelectionChanged(allItems[idx]);
            }
         },
         
         setItemAt: function(idx, datum) {
            var itm = allItems[idx], content;
            if(itm) {
               data[idx] = datum;
               itm.data("model", datum);

               content = opts.render(widget, itm, idx, datum);
               // check if the renderer has already appended
               if(content) {
                  if(util.isTypeOf(content, "String"))   {
                     itm.html(content);
                  }else {
                     itm.append(content);
                  }
               }
            }
         },
         
         selectItemById: function(id) {
            util.forEach(allItems, function(item) {
               // var dataset = item.dataset, model = dataset ? dataset.model : null;
               var model = item.data("model");               
               if(model && model.id === id)   {
                  fireSelectionChanged(item);
                  return util.Break;
               }
               return null;
            });
         }
      };
      
      render();
      
      return widget;
   });
})(lite);



/**
 * A simple form validator plugin for lite
 * From (http://code.google.com/p/jaf)
 * 
 * The validator takes the following two arguments. The validation rules that tell what fields need what kind of validations and
 * Validation message renderer, an object that handles showing and clearing validation error messages.
 * 
 * Rules: 
 * 
 * The rules define validation rules that specify what validator, what field, validation constraints (like min and max for number validation)
 * and finally validation message if the validation fails. Along with that it also specifies special constraints like 'validateIf' which means
 * the validation will be done only if the condition (which is a function) specified by 'validateIf' is true.
 * 
 * Each rule is an object containing following basic properties (apart from validation constraints)
 * 
 *  myFieldId: [
 *      {    // the ID of the field to attach this validator to.
 *      
 *          // This is a built in type of validator. This can take following names:
 *          // required, pattern, time, date, number, ipAddress, fieldCompare.
 *          type: "required",
 *      
 *          // This is the message to show if validation fails
 *          message: "myField is required!"
 *      },
 *      {
 *          type: function(value, constraints) {
 *              
 *          },
 *          message: "That custom function failed!!"
 *      }
 *  ]
 *  
 *  
 *  Renderer:
 *  
 *  The renderer is responsible for showing validation error messages and clearing them if validation succeeds. This objects must have
 *  two methods:
 *  
 *  render(array of messages) Render the array of validation messages. Each message in this array has following properties:
 *  id: The id of the field that failed validation
 *  message: The actual message to show.
 *  
 *  clear() Clear the validation messages that were rendered when validation failed.
 * 
 * @usage
 * 
 *  $.validator({
 *      rules: {
 *          "username": [
 *              {
 *                  type: "required", 
 *                  message: 'User Name is required',
 *                  validateIf: conditions.isTechUser
 *              },
 *              {
 *                  type: "pattern",
 *                  pattern: /^[0-9A-Za-z]+$/, 
 *                  message: 'Username must be alpha-numeric',
 *              }
 *          ],
 *
 *          "password": {
 *              type: "required", 
 *              message: 'Password is required',
 *          }
 *      },
 *      renderer: {
 *          render: function(arrMsg) {
 *              var msgs = [];
 *              util.forEach(arrMessage, function(msg) {
 *                  msgs.push(msg.message);
 *              });
 *              alert(msgs.join('\n'));
 *          },
 *          clear: function() {}
 *      }
 *  });
 * 
 * @author anaik
 */
(function($) {
   var util = $.util,
      
      isBlank = function(objValue)   {
         if(objValue === null || objValue === undefined) {
            return true;
         }
         return (util.isTypeOf(objValue, "String") && util.trim(objValue).length === 0);
      },
      
      validators = {
         /**
          * This function is the mandatory field validator. Fails if the
          * the given value is null or a blank string
          */
         required: function(value) {
            return !isBlank(value);
         },

         /**
          * Validates if the given value matches a regular expression.
          * @param {Object} value The value to validate
          * @param {Object} options This object should contain the pattern field
          * e.g. var options = {pattern: "^*.$"};
          * @return true if the value matches the pattern or false, also returns true
          * if the options or pattern is not specified
          */
         pattern: function(value, options) {
            var pattern = options.pattern;
            if(options && pattern)   {
               if(typeof pattern === "string") {
                  return new RegExp(pattern).test(value);
               }else if(typeof pattern.test === "function") {
                  return pattern.test(value);
               }else {
                  console.log("Validator pattern not found for value: " + value);
               }
            }
            return true;
         },

         /**
          * Validates if the specified value is a time. Additionally format validation
          * can also be done.
          * @param {Object} value The value to validate
          * @param {Object} options The options object containing a field "format"
          * <tt>
          *    format: "hh:mm:ss"
          * </tt>
          * Three formats are currently supported:
          * <ul>
          *    <li>hh:mm:ss AMPM</li>
          *    <li>hh:mm:ss</li>
          *    <li>hh:mm (default if not specified)</li>
          * </ul>
          */
         time: (function() {
            var arrFormats = {
               "hh:mm:ss AMPM": /^(0[1-9]|1[0-2])\:[0-5][0-9]\:[0-5][0-9]( )?(AM|am|aM|Am|PM|pm|pM|Pm)$/,
               "hh:mm:ss": /^(0[0-9]|1[0-9]|2[0-3])\:[0-5][0-9]\:[0-5][0-9]$/,
               "hh:mm": /^(0[0-9]|1[0-9]|2[0-3])\:[0-5][0-9]$/
            };

            return function(value, options) {
               var timeFormat = options.format || arrFormats["hh:mm:ss AMPM"], timePattern;

               if(util.isTypeOf(timeFormat, "String")) {
                  timePattern = arrFormats[timeFormat];
                  if(typeof(timePattern) === "undefined")   {
                     return false;
                  }
                  return new timePattern.test(value);
               }
               return true;
            };
         })(),

         /**
          * Validates if the given value is a date
          * @param {Object} value The value passed to validate
          * @param {Object} options This object contains a format for date specified by
          * options.format field. Currently only one format is supported: "mm-dd-yyyy"
          */
         date: (function() {
            var arrFormats = {
               "mm-dd-yyyy" : new RegExp("^((0?[13578]|10|12)(-|\\/)((0[0-9])|([12])([0-9]?)|(3[01]?))(-|\\/)((\\d{4}))|(0?[2469]|11)(-|\\/)((0[0-9])|([12])([0-9]?)|(3[0]?))(-|\\/)((\\d{4})))$")
            };

            return function(value, options) {
               var dateFormat = options.format || arrFormats["mm-dd-yyyy"], datePattern;

               if(util.isTypeOf(dateFormat, "String")) {
                  datePattern = arrFormats[dateFormat];
                  if(typeof(datePattern) === "undefined")   {
                     return false;
                  }
                  return datePattern.test(value);
               }
               return true;
            };
         })(),

         /**
          * Validates that given value is a number
          * @param {Object} value The value to validate
          * @param {Object} options This object can contain additional options:
          * options.min for minimum value check.
          * options.max for maximum value check.
          * <tt>
          *       min:30
          *       max:45
          * </tt>
          */
         number: function(value, options) {
            if(isNaN(value) || typeof(value) === "undefined" || ("" + util.trim(value)) === "")   {
               return false;
            }
            var num = Number(value), min = options.min, max = options.max;

            if(min && max) {
               return num >= Number(min) && num <= Number(max);
            }else if(min != null)  {
               return num >= Number(min);
            }else if(max != null)  {
               return num <= Number(max);
            }

            // this is a number otherwise
            return true;
         },
         
         ipAddress: (function() {
            var regExp = /^([01]?\d\d?|2[0-4]\d|25[0-5])\.([01]?\d\d?|2[0-4]\d|25[0-5])\.([01]?\d\d?|2[0-4]\d|25[0-5])\.([01]?\d\d?|2[0-4]\d|25[0-5])$/;
            return function(value, options) {
               return regExp.test(value);
            }
         })(),
        
         ipAddress6: (function() {
            var regExp = /^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/;
            return function(value, options) {
               return regExp.test(value);
            }
         })(),

         ipAddress4and6: (function() {
            var regExp4 = /^([01]?\d\d?|2[0-4]\d|25[0-5])\.([01]?\d\d?|2[0-4]\d|25[0-5])\.([01]?\d\d?|2[0-4]\d|25[0-5])\.([01]?\d\d?|2[0-4]\d|25[0-5])$/;
            var regExp6 = /^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/;
            return function(value, options) {
               return  (regExp4.test(value) || regExp6.test(value) || value == '*');
            }
         })(),

         /**
          * Compares if the two form fields have the same value
          * e.g. This is useful for email confirmation, new password comparisons, etc.
          * @param {Object} value
          * @param {Object} options This object contains the ids of the fields
          * to compare for equality specified by options.fields, the value of
          * which must be an array of Strings
          * <tt>
          *       fields: ["password", "confirmPassword"]
          * </tt>
          */
         fieldCompare: function(value, options) {
            var arrFieldIds = options.fields || [], field, i , len;
            for(i = 0, len = arrFieldIds.length; i < len; i++)   {
               field = $("#" + arrFieldIds[i]);
               if(value !== field.val())  {
                  return false;
               }
            }
            return true;
         }
      };
      
   /**
    * FieldValidator uses various validators as defined by validation information
    * to validate the fields. Renders error messages if any of the field values
    * are not valid.
    */
   $.plugin("validator", function(options)  {
      var ruleMap = options.rules || {},  renderer = options.renderer;
      
      /**
       * Validates the field specified by <tt>fieldId</tt> whose value
       * is <tt>value</tt>
       * @return Any error message as a result of validation or null
       */
      function validateField(fieldId, value) {
            var field = $("#" + fieldId), 
               arrVRules,
               rule,
               vType,
               validator,
               options,
               validateIf,
               message,
               customMessage,
               i, len;
            
            if(field.get(0) && field.attr("disabled"))   {
               // don't validate disabled fields
               return null;
            }
   
            arrVRules = ruleMap[fieldId];
            
            if(! util.isTypeOf(arrVRules, "Array"))  {
               arrVRules = [arrVRules];
            }
            
            for(i = 0, len = arrVRules.length; i < len; i++)   {
               rule = arrVRules[i];
               vType = rule.type;
               validator = util.isTypeOf(vType, "Function") ? vType : validators[vType];
               options = util.agument({}, rule); //valInfo.options || {};
               message = rule.message;
               validateIf = rule.validateIf;
               
               
               if(util.isTypeOf(validateIf, "Function") && !validateIf()) {
                  return null;
               }
               
               if(! validator(value, options))  {
                  customMessage = options.message || message;
                  customMessage = customMessage || ("Invalid value: " + fieldId + "(" +
                        rule.validator + ")");
                  return {id: fieldId, message: customMessage};
               }
            }
            return null;
      }
      
      /**
       * Renders validation messages via the specified renderer
       */
      function render(arrMsgs)   {
         if(renderer && util.isTypeOf(renderer.render, "Function"))  {
            renderer.render(arrMsgs);
         }else {
            alert(arrMsgs.join("\n"));
         }
      }
      
      /**
       * Asks the renderer to clear the messages
       */
      function clear()   {
         if(renderer && util.isTypeOf(renderer.clear, "Function"))  {
            renderer.clear();
         }
      }
   
      return   {
         addRules: function(objRules) {
            util.forEach(objRules, function(fldId, rule) {
               this.add(fldId, rule);
            }, this);
         },
         
         /**
          * Adds a field validation information to this FieldValidator
          * @param {String} fieldId The id form field whose value to validate
          * @param  {Object} validatorOpts The validation options object containing
          * following information:
          * The validator to use, which must be one of the validators specified
          * in <tt>Validators</tt>.
          * The options to be passed to the validator.
          * The message to show if validation fails.
          * e.g.
          * <tt>
          *    var validatorOpts = {
          *       type: "number",
          *       min: 0,
          *       max: 100
          *       message: "The value must be between 0 and 100 (enclusive)"
          *    };
          * </tt>
          */
         add: function(fieldId, vOpts /* can be 1 or an array of opts */)   {
            var arrVals = ruleMap[fieldId];
            if(typeof(arrVals) === "undefined") {
               arrVals = ruleMap[fieldId] = [];
            }
   
            vOpts = vOpts || [];
            if(! util.isTypeOf(vOpts, "Array"))  {
               vOpts = [vOpts];
            }
            
            util.forEach(vOpts, function(opt) {
               arrVals.push(opt);
            });
            return this;
         },
         
         validate: function(arrFlds) {
            var arrMsgs = [];
            
            if(!arrFlds) {
               // validate all fields
               return this.validateAll();
            }
            
            arrFlds = arrFlds || [];
            if(!util.isTypeOf(arrFlds, "Array")) {
               arrFlds = [arrFlds];
            }
            
            util.forEach(arrFlds, function(fieldId) {
               var field = $("#" + fieldId), value = field.val(); 
               msg = validateField(fieldId, value);
               // see if there is a message (in case of validation failure)
               if(msg)  {
                  arrMsgs.push(msg);
               }
            });
            if(arrMsgs.length > 0)  {
               render(arrMsgs);
               return false;
            }
            return true;
         },
            
         /**
          * Clears the rendered messages
          */
         clear: clear,
   
         /**
          * Validates each field added to this validator, collects the messages and
          * renders the messages if any of the validations fail.
          */
         validateAll: function() {
            clear();
            var arrMsgs = [], field, msg, fieldId, value;
            for(fieldId in ruleMap)  {
               field = $("#" + fieldId); 
               value = field.val(); 
               msg = validateField(fieldId, value);
               // see if there is a message (in case of validation failure)
               if(msg)  {
                  arrMsgs.push(msg);
               }
            }
            if(arrMsgs.length > 0)  {
               render(arrMsgs);
               return false;
            }
            return true;
         }
      };
   });
})(lite);


/**
 * A widget that allows to add rows to a table dynamically
 * @example
 * $.rows("selector", {
 *  tableClass: table css class,
 *  rowClass: row class for all rows
 *  
 *  data:[
 *     ["Row1-Cell1", "Row1-Cell2", "Row1-Cell3"],
 *     ["Row2-Cell1", "Row2-Cell2", "Row2-Cell3"],
 *     ["Row3-Cell1", "Row3-Cell2", "Row3-Cell3"],
 *  ],
 *  
 *  render: function({
 *    tr: the tr element, 
 *    td: the td element, 
 *    rwoData: the row array, 
 *    rowIndex: the row index,
 *    colIndex: the column index
 *  }) {},
 * });
 */
(function($) {
   var defaults = {
      data: null,
      renderer: function(options) {
         var td = options.td, row = options.rowData, colIndex = options.colIndex;
         td.innerHTML = row[colIndex];
      },
      editor: function(options) {
          throw new Error("Table not editable");
      },
      rowClass: null,
      cellClass: null
   },
    
   util = $.util,
   forEach = util.forEach;
    
   $.widget("Table", function(options) {
         // these are our final options
      var opts = util.agument(options, defaults),

         domRows = [],
         data = [],
         
         renderer = opts.renderer,
         editor = opts.editor,
         // keeps track of currently editing (dirty row indices)
         editing = [],
         
         self = this,
         element = self.get(0),
         elemName = element.nodeName.toLowerCase(),
         
         table,
         tbody,
         tbodyElem;
         
      if(!element) {
         console.log("No element found matching selector");
         return this;
      }
      if(elemName === "table") {
         table = self;
         tbody = self.find("tbody");
      }else if(elemName === "tbody") {
         table = $(element.parentNode);
         tbody = self;
      }else {
         table = $(document.createElement("table"));
         tbody = $(document.createElement("tbody"));
         table.append(tbody);
         self.append(table)
      } 
      
      table.addClass(opts.tableClass || "");
      
      tbodyElem = tbody.get(0);
      
      forEach(opts.data, function(row, i) {
         insertRow(row, i);
      });
      
      function defaultComparator(search, data) {
          return search == data;
      }
      
      function insertRow(row, i) {
         var tr = tbodyElem.insertRow(i), theRow = $(tr);
         theRow.data("model", row);
         
         if(opts.rowClass) {
            theRow.addClass(opts.rowClass || "");
         }
         
         domRows.splice(i, 0, theRow);
         data.splice(i, 0, row);
         
         forEach(row, function(cellData, j) {
            var td = tr.insertCell(-1);
            if(opts.cellClass) {
               td.className = opts.cellClass;
            }
            renderer({
               tr: tr,
               td: td,
               rowData: row,
               cellData: cellData,
               rowIndex: i,
               colIndex: j
            });
         });
      }
      
      function removeRow(i) {
         var row = domRows[i], tr = row.get(0);
         domRows.splice(i, 1);
         data.splice(i, 1);
         tr.parentNode.removeChild(tr);
      }
      
      
      return {
         $: self,
         
         rowData: function() {
            return data.slice(0);
         },
         addRow: function(rowData) {
            insertRow(rowData, data.length);
         },
         addRows: function(rows) {
            for(var i = 0, len = rows.length; i < len; i++) {
                this.addRow(rows[i]);
            }
         },
         editRow: function(index) {
             if(index >= 0 && index < data.length) {
                 if(editing.indexOf(index) !== -1) {
                    return;
                 }
                 
                 var tr = domRows[index], tds = tr.children("td"), trData = tr.data("model");
                 forEach(trData, function(cellData, i) {
                     editor({
                         tr: tr,
                         td: tds[i],
                         rowData: trData,
                         cellData: cellData,
                         rowIndex: index,
                         colIndex: i
                     });
                 });
                 
                 editing.push(index);
             }
         },
         cancelEdit: function() {
             var idx, self = this;
             if(arguments.length === 0) {
                 // cancel all edits
                 forEach(editing, function(j) {
                     self.updateRow(data[j], j);
                 });
                 return;
             }
             
             for(var i = 0, len = arguments.length; i < len; i++) {
                 idx = arguments[i];
                 if(idx >= 0 && idx < data.length) {
                    if(editing.indexOf(idx) === -1) {
                        continue;
                    }
                    self.updateRow(data[idx], idx);
                 }
             }
         },
         updateRow: function(rowData, index) {
            if(index >= 0 && index < data.length) {
               var tr = domRows[index], tds = tr.children("td");
               
               // update the model
               tr.data("model", rowData);
               data[index] = rowData;
               
               // render the data
               forEach(rowData, function(cellData, i) {
                  renderer({
                     tr: tr,
                     td: tds[i],
                     rowData: rowData,
                     cellData: cellData,
                     rowIndex: index,
                     colIndex: i
                  });
               });
               
               // clear the dirty status
               var idx = editing.indexOf(index);
               if(idx !== -1) {
                   editing.splice(idx, 1);
               }
            }
         },
         indexOf: function(searchData, comparator) {
             comparator = comparator || defaultComparator;
             for(var i = 0, len = domRows.length; i < len; i++) {
                 var rData = domRows[i].data("model");
                 if(comparator(rData, searchData)) {
                     return i;
                 }
             }
             return -1;
         },
         insertRow: function(rowData, index) {
            if(index >= 0 && index < data.length) {
               insertRow(rowData, index);
            }
         },
         removeRow: function(index) {
            var i , len;
            if(typeof index === "function") {
               for(i = 0, len = domRows.length; i < len; i++) {
                  if(index(domRows[i])) {
                     removeRow(i);
                     break;
                  }
               }
            }else {
               if(index >= 0 && index < data.length) {
                  removeRow(index);
               }
            }
         },
         rowCount: function() {
             return domRows.length;
         }
      };      
      
    });
})(lite);


/**
 * A simple tabs widget
 * @author aniket (http://code.google.com/p/jaf)
 */
(function($)   {
   var defaults = {
      onselect: function() {},
      selectedIndex: 0
   }, util = $.util;
   
   $.widget("Tabs", function(options)  {
      var widget,
         // these are our final options
         opts = util.agument(options, defaults),
         id = this.attr("id"),
         // our plugin is bound to an HTML ul element
         tabs = this.children("li"),
         self = this,
         // store the contents
         container = $("#" + id + "-contents"),
         // array containing content divs for each tabs 
         contents = [],
         selectedIndex = opts.selectedIndex,
         
         // tab selection logic
         selectTab = function(tabData) {
            clearTabs();
            selectedIndex = tabData.index;
            tabData.tab.addClass("selected");
            showTabContent(tabData);
         },
         
         selectTabByIndex = function(idx)  {
            if(idx < 0 || idx > tabs.length) {
               return;
            }
            var $tab = $(tabs[idx]), ref = $tab.attr("data-ref");
            selectTab({
               tab: $tab,
               index: idx,
               contentId: ref
            });
         },
         
         showTabContent = function(tabData) {
            var id = tabData.contentId;
            
            if(id.indexOf("#") === 0) {
               // $(id).setStyle({display: "block"});
               $(id).addClass("tab-content-selected");
            }else {
               window.location.href = id;
            }
         },
         
         clearTabs = function()   {
            hideContents();
            util.forEach(tabs, function(tab, idx) {
               $(tab).removeClass("selected");
            });
            selectedIndex = -1;
         },
         
         hideContents = function() {
            util.forEach(contents, function(con) {
               // con.setStyle({display: "none"});
               con.removeClass("tab-content-selected");
            });
         };
         
      function handler(data) {
         var retVal = opts.onselect(data.tab.get(0), data.index);
         if(typeof(retVal) !== "undefined" || retVal !== false) {
            selectTab(data);
         }
         return false;
      }
      
      // iterate over tabs and add bind events
      util.forEach(tabs, function(liElem, idx)   {
         var $li = $(liElem),
            // $a = $li.find("a:first-child"),
            href = $li.attr("data-ref");
         
         // this is not a valid tab
         if(typeof(href) === "undefined")   {
            return;
         }
         
         if(href.indexOf("#") === 0) {
            contents.push($(href));
         }
         
         // find the first a element and bind with 'click' event, null data, and a handler
         $li.bind("click", handler.bind(null, {tab: $li, index:idx, contentId: href}));
      });
      
      // by default select the tab as specified by selectedIndex
      selectTabByIndex(opts.selectedIndex);
      
      // our widget API object
      widget = {
         $: self,
         getSelectedIndex: function()  {
            return selectedIndex;
         },
         
         selectTab: function(idx)   {
            selectTabByIndex(idx);
         }
      };
      
      return widget;
   });
})(lite);




/** 
 * Highlight widget, that briefly highlights an element.
 */
(function($)   {
   var forEach = $.util.forEach;
   
   $.widget("Highlight", function(color)  {
      var origBg = this.getStyle("backgroundColor");
      var self = this;
      this.css("background-color", color || "#FAF6CE");
      
      window.setTimeout(function() {
         self.css("background-color", origBg);
      }, 1000);
      
      return this;
   });
})(lite);

