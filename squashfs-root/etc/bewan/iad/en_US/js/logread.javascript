/**
 * A simple log segregator 
 * @author aniket
 * @codebase singtel UI (new)
 */
var LogAnalyzer = (function($) {
    var util = $.util,
    // month day hh:mm:ss domainname level module message
    regExp = /^([a-zA-Z]{3})\s+(\d{1,2})\s+(\d{2}:\d{2}:\d{2})\s+([^\s]+)\s+([^\s]+)\s([^\s]+)\s+(.*)$/,
   
    // sometimes the mod name contains a pid e.g. 'TR-069[1439]' instead of just 'TR-069'
    modPidExp = /[^\[]+\[\d+\]/,
   
    levels = ["debug", "info", "notice", "warn", "err", "crit", "alert", "emerg"]; // order is important!
   
    /**
     * Parses the log message into a log message object. 
     * @param {String} rawMsg The raw log message
     * @param {Object} prevMsg The previous log message (prior to this). This is if the 'rawMsg' does not confirm to the
     * log format, its assumd to be the part of the previous message
     * @return {Object} The log message object
     */
    function parseLog(rawMsg, prevMsg) {
        if(!rawMsg) {
            return null;
        }
      
        if(! regExp.test(rawMsg)) {
            if(prevMsg) {
                prevMsg.message += rawMsg;
            }else {
                console.log("Not a log message: " + rawMsg);
            }
            return null;
        }
      
        var parts = rawMsg.split(" "), rLevel, lvlParts, lvl, mod, pid, logMessage, filtered = [];
      
        // strip out empty strings
        parts = util.filter(parts, function(p) {
            return p;
        });
      
        rLevel = parts[4];
        lvlParts = rLevel.split(".");
        lvl = lvlParts[1] || lvlParts[0];
      
        mod = parts[5].slice(0, -1);
        if(modPidExp.test(mod))  {
            pid = mod.substring(mod.indexOf("["));
            mod = mod.substring(0, mod.indexOf("["));
        }
      
        logMessage = {
            date: parts.slice(0, 3).join(" "),
            domain: sanatize(parts[3]),
            level: lvl,
            lvl: rLevel,
            module: sanatize(mod),
            pid: pid || "",
            message: sanatize(parts.slice(6).join(" "))
        };
        // console.log(JSON.stringify(logMessage));
        return logMessage;
    }
   
    function sanatize(strRaw) {
        return strRaw.replace("<", "&lt;").replace(">", "&gt;");
    }
   
    /**
     * Gets all the levels above and including the specified level. This order is specified by the "levels" array (see line 13)
     */
    function getLevelsAbove(level)   {
        var idx; 
        level = level || "debug";
        util.forEach(levels, function(lvl, i) {
            if(lvl === level) {
                idx = i;
                return util.Break;
            }
            return null;
        });
        return levels.slice(idx);
    }
   
    /**
     * The LogAnalyzer object.
     * @param {String} The raw log output of the logread command
     */
    return function(logsRaw) {
        var arrLogs = logsRaw.split("\n"), allLogs = [], prevLog = null, modules = {}, arrMods = [];
      
        util.forEach(arrLogs, function(l) {
            var msg = parseLog(util.trim(l), prevLog); // trim is used as in opera split() also includes the \n char in this case
            if(msg) {
                allLogs.push(msg);
                modules[msg.module] = "";
            }
            prevLog = msg;
        });
      
        util.forEach(modules, function(val, key) {
            arrMods.push(key);
        });
        modules = {};
      
        return {
            getModules: function() {
                return arrMods.slice(0);
            },
         
           /**
            * Gets all logs of all modules in the order they were logged
            */
            getAllLogs: function(lvl)  {
                if(arguments.length === 0) {
                    return allLogs.slice(0);
                }else {
                    var lvls = getLevelsAbove(lvl), logs;            
                    // filter out logs that have specified module and level
                    logs = util.filter(allLogs, function(log) {
                        var ok = false;
                        util.forEach(lvls, function(lvl) {
                            if(log.level === lvl)   {
                                ok = true;
                                return util.Break;
                            }
                            return false;
                        });
                        return ok;
                    });
                    return logs;
                }
            },
         
           /**
            * Gets the logs (as array) for the specified module with all the levels above <tt>level</tt> including that level.
            * @param {String} The module name
            * @param {String} The optional log level above which to show logs. 
            *                 One of "debug", "info", "notice", "warn", "err", "crit", "alert", "emerg"
            * @return {Array} The log array. Empty array if none are found
            */
            getLogs: function(module, level) {
                var lvls = getLevelsAbove(level), logs;
                // filter out logs that have specified module and level
                logs = util.filter(allLogs, function(log) {
                    var ok = false;
                    util.forEach(lvls, function(lvl) {
                        if(log.level === lvl && log.module === module)   {
                            ok = true;
                            return util.Break;
                        }
                        return false;
                    });
                    return ok;
                });
                return logs;
            }
        };
    };
})(lite);



var Page = (function($, App) {
    var logsRaw, logAnalyzer, paginator, logWidget, paginatorWidget,
    config,
    util = $.util,
    // msgUtil = App.MessageUtil,
    logTemplate = lite.template([
        '<span class="date">{date}</span> ',
        '<span class="domain">{domain}</span> ',
        '<span class="level">{level}</span> ',
        '<span class="module">{module}</span> ',
        '<span class="message">{message}</span>'
        ].join(""));
   
   /**
    * Paginator allows you to move through a set of records one page at a time
    * This creates a paginator with specified records and pageSize
    * @param {Array} recs The records to paginate over
    * @param {Number} pgSize Optinal page size. Default is 20
    */
    function Paginator(recs, pgSize) {
        var pageSize = pgSize || 20, records = recs.slice(0) || [], recLen = records.length, currPage = 0, numPages;
      
        function calculatePages() {
            return recLen == 0 ? 0 : Math.ceil(recLen / pageSize);
        }
      
        function reset() {
            currPage = 0;
            recLen = records.length;
            numPages = calculatePages();
        }
      
        function hasPrevious() {
            return currPage >= pageSize;
        }
      
        function hasNext() {
            return currPage + pageSize < recLen;
        }
      
        numPages = calculatePages();
      
        return {
            getNumberOfPages: function() {
                return numPages;
            },
         
            getPageNumList: function() {
                var arr = [];
                for(var i = 0; i < numPages; i++)   {
                    arr[arr.length] = i;
                }
                return arr;
            },
         
            setRecords: function(recs) {
                records = (recs || []).slice(0);
                reset();
            },

            hasNext: hasNext,

            hasPrevious: hasPrevious,

           /**
            * Moves to previous page if its available
            * @return true if successfully moved to previous page else false
            */
            previousPage: function() {
                if(! hasPrevious())  {
                    return false;
                }
                currPage -= pageSize;
                return true;
            },

           /**
            * Moves to next page if its available
            * @return true if successfully moved to next page else false
            */
            nextPage: function() {
                if(! hasNext())  {
                    return false;
                }
                currPage += pageSize;
                return true;
            },

           /**
            * Moves to a specified page.
            * @param {Number} numPage The page number to move. The page number is a 0 based index
            * @return true if sucessfully moved else false
            */
            moveToPage: function(numPage) {
                var idx = (numPage) * pageSize;
                if(idx < recLen && idx >= 0)   {
                    currPage = idx;
                    return true;
                }else {
                    console.log("No such page: " + numPage);
                    return false;
                }
            },

           /**
            * Gets an array of records in this paginator's current page
            * @return {Array} Records in the current page
            */
            getCurrentPage: function() {
                var first = currPage, last = currPage + pageSize;
                last = last > recLen - 1 ? recLen: last;
                return records.slice(first, last);
            }
        };
    }
   
    return {
        init: function(data) {
            var next = $("#next"), prev = $("#prev"), logs = $("#logsRaw"), selModules = $("#logModule"), allMods;
         
            logs.val("");
            config = ConfigAccess(data.token);
            config.fct("logread");
            config.commit(function(resp) {
                if(resp.error) {
                    alert(resp.error);
                }else {
                    logsRaw = resp.logread;
                    logsRaw = logsRaw.split('|').join('\n');
                    // create the log analyser and group all logs
                    logAnalyzer = LogAnalyzer(logsRaw);
                    allMods = logAnalyzer.getModules();
                    // create a paginator for pagination with default logs for syslog module
                    paginator = Paginator(logAnalyzer.getLogs(), 40);

                    console.log("Found log modules: " + allMods);
                
                    // append all the available modules to the module select widget
                    util.forEach(allMods, function(mod) {
                        selModules.append("<option value='" + mod + "'>" + mod + "</option>");
                    });
                    selModules.val("all");
                        
                    paginatorWidget = $.DataList("#paginator", {
                        listClass: "pages",
                        itemClass: "page-num",
                        data: paginator.getPageNumList(),
                        render: function(widget, li, liIdx, arrItem) {
                            li.html("<span class='trigger'>" + (liIdx + 1) + "</span>");
                        },
                        onselectionchange: function() {
                            var itm = paginatorWidget.getSelectedItem(), pgNo = itm.data("model");
                            goToPage(pgNo);
                        }
                    });

                    showLogs();
                }
            });
         


            function goToPage(idx) {
                if(paginator.moveToPage(idx)) {
                    logWidget.setItems(paginator.getCurrentPage());
                    paginatorWidget.selectItemAt(idx);
                }
            
                if(!paginator.hasNext()) {
                    next.addClass("disabled");
                }else {
                    next.removeClass("disabled")
                }
            
                if(!paginator.hasPrevious()) {
                    prev.addClass("disabled");
                }else {
                    prev.removeClass("disabled")
                }
            }
         
            function showLogs() {
                var mod = $("#logModule").val(), level = $("#logLevel").val();
                logWidget.setItems(null);
            
                if(mod === "all") {
                    paginator.setRecords(logAnalyzer.getAllLogs(level));
                }else {
                    paginator.setRecords(logAnalyzer.getLogs(mod, level));
                }
                paginatorWidget.setItems(paginator.getPageNumList());
                goToPage(0);
            }
         
            logWidget = $.DataList("#logs", {
                listClass: "logs",
                itemClass: "log",
                data: [],
                render: function(logList, li, liIdx, logMsg) {
                    li.addClass(logMsg.level);
                    return logTemplate.process(logMsg);
                }
            });
         
            /*
            $("#clearLogs").bind("click", function() {
                config.rollback().fct("clear_logs").commit(function(resp) {
                if(resp.error) {
                    // msgUtil.error(resp.error);
                    alert(resp.error);
                }else {
                    alert('Successfully cleared box logs');
                    paginator.setRecords(null);
                    paginatorWidget.setItems(null); //clear the list
                    logWidget.setItems(null);
                    $("#logModule").attr("disabled", "disabled").html("");
                    $("#paginatorCont").setStyle({display: "none"});
                }
                });
            });
            */
         
            $("#logModule").bind("change", showLogs);
         
            $("#logLevel").bind("change", showLogs);
         
            next.bind("click", function() {
                var itm = paginatorWidget.getSelectedItem(), pgNo = itm ? itm.data("model") : 0;
                goToPage(pgNo + 1);
            });
         
            prev.bind("click", function() {
                var itm = paginatorWidget.getSelectedItem(), pgNo = itm ? itm.data("model") : 0;
                goToPage(pgNo - 1);
            });
         
        }
    }
})(lite, App);