var DiagTestsView = (function($) {
   function testNotDnsQuery() {
      return $("#testType").val() !== "diag_nslookup";
   }
   
   function testPing() {
      return $("#testType").val() === "diag_ping";
   }

   function noop() {
   }
   
   function TestRunner(options)   {
      var timerId, 
         pid,
         started = false, 
         working = false, 
         test = options.command,
         onStart = options.onstart || noop,
         onStop = options.onstop || noop,
         interval = options.interval || 1000,
         args = options.args.join("|"),
         onresult = options.onresult,
         config = ConfigAccess(options.token);
         
      function log(msg) {
         if(window.console) {
            console.log(test + ": " + msg);
         }
      }
         
      function fireShow() {
         if(!working) {
            working = true;
            log("Firing show")
            config.rollback()
               .fct(test, "SHOW|" + pid)
               .commit(handleShowResponse, handleShowResponse);
         }else {
            log("Working...");
         }
         if(started) {
            timerId = window.setTimeout(fireShow, interval);
         }
      }
      
      function handleShowResponse(xhr) {
         working = false;
         if(typeof onresult === "function" && started) {
            if(xhr.error) {
               onresult(xhr.error);
               return;
            }else if (xhr[test] === "FINISHED") {
               stopTest(false);
               return;
            }else if(xhr[test]) {
               onresult(xhr[test]);
               return;
            }else if(typeof xhr.responseText !== "undefined") {
               onresult(xhr.responseText);
            }
         }
      }
      
      function fireStop() {
         config.rollback()
               .fct(test, "STOP|" + pid)
               .commit(null, function(xhr) {});
      }
      
      function handleStartResponse(res) {
         log("Received start response");
         working = false;
         if(res.error || !res[test]) {
            onresult(res.error || 'Erro ao iniciar teste');
            return;
         }
         pid = res[test];
         fireShow();
         onStart();
      }
      
      function startTest() {
         log("Starting new");
         config.rollback()
            .fct(test, "START|" + args)
            .commit(handleStartResponse, handleStartResponse);
      }

	  function stopTest(bFire) {
         working = false;
         if(started) {
             started = false;
             log("Stopping");
             window.clearTimeout(timerId);
             if (bFire !== false) {
                 fireStop();
			 }
             onStop();
          }
	  }
      
      return {
         start: function() {
            if(started) {
               log("Stopping old");
               this.stop();
            }
            started = true;
            startTest();
         },
         
         isRunning: function() {
             return started;
         },
         
         stop: function() {
			 stopTest();
         }
      };
   }   
   
   var config, util = $.util,
      // validation rules
      rules = {
         ipAddress: {type: "required", message: 'Por favor, informe o endereço de um dispositivo.'},
         testDepth: [
            {type: "required", validateIf: testNotDnsQuery, message: 'Por favor, informe a profundidade do teste.'},
            {type: "number", validateIf: testNotDnsQuery, min: 1, max: 32, message: 'O teste de profundidade pode ser um número entre 1 e 32.'}
         ],
         packetSize: [
            {type: "required", validateIf: testPing, message: 'Por favor, informe um tamanho de pacote.'},
            {type: "number",  validateIf: testPing, min: 1, max: 576, message: 'O tamanho do pacote deve ser um número entre 1 e 576.'}
         ]
      },
      // field validator
      validator = $.validator({rules: rules, renderer: App.ValidationMessageRenderer()}),
      
      argFieldMap = {
         diag_ping: ["ipAddress", "packetSize", "testDepth"],
         diag_traceroute: ["ipAddress", "testDepth"],
         diag_nslookup: ["ipAddress"]
      },
      
      testRunner,
      
      resultsTa;
      
   return {
      init: function(token) {
         var testDepth = $("#testDetails .test-depth"), packetSize = $("#testDetails .packet-size"),
            testType = $("#testType"), ipAddress = $("#ipAddress"), 
            show = {display: "block"}, hide = {display: "none"};
            
            
         // config = ConfigAccess(token);
         resultsTa = $("#testResults");
         
         function toggleUi(testType) {
            switch(testType) {
               case "diag_traceroute":
                  packetSize.setStyle(hide);
                  testDepth.setStyle(show);
                  break;
               case "diag_nslookup":
                  packetSize.setStyle(hide);
                  testDepth.setStyle(hide);
                  break;
               default:
                  packetSize.setStyle(show);
                  testDepth.setStyle(show);
            }
         }
         
         testType.bind("change", function() {
            var val = $(this).val();
            toggleUi(val);
         });
         
         $("#startTest").bind("click", function() {
            var val, argsFld, args = [], self = $(this), startTestUi = $("#startTest"), busyUi = $("#diagTestBusy");
            
            if(testRunner && testRunner.isRunning()) {
                testRunner.stop();
                return;
            }
            
            resultsTa.val('');
            if(validator.validate()) {
               val = testType.val();
               argsFld = argFieldMap[val];
               
               util.forEach(argsFld, function(fld) {
                  args.push($("#" + fld).val());
               });
               
               
               testRunner = TestRunner({
                  token: token,
                  command: val,
                  onstart: function(){
                      startTestUi.val('Parar');
                      $("#startTest").find("span").html('PARAR');
                      busyUi.removeClass("none");
                  },
                  onstop: function(){
                      startTestUi.val('Iniciar');
                      $("#startTest").find("span").html('INICIAR');
                      busyUi.addClass("none");
                  },
                  args: args,
                  interval: 1500,
                  onresult: function(res) {
                     if(util.trim(res).length === 0)  {
                        resultsTa.val('');
                        testRunner.stop();
                        return;
                     }
                     // console.log(res.replace('\\|', '\n'));
                     res = res.split('|').join('\n');
                     resultsTa.val(res);
                  }
               });
               
               testRunner.start();
            }
         });
                  
         $("#clearResults").bind("click", function() {
            resultsTa.val("");
         });
         
         toggleUi(testType.val());
      }
   }
})(lite);
