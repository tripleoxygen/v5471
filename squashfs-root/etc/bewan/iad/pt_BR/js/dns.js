(function() {
   var activeWan = eval('(<!--#echo jsonvar="cli=Layer3Forwarding_ActiveConnectionService"-->)'),
      hostName = eval('<!--#echo jsonvar="cli=Device_Hostname"-->'),
      domain = eval('<!--#echo jsonvar="cli=Device_Domain"-->'),
      alises = eval(' ( <!--#echo jsonvar="cli=Device_Aliases"--> ) '),
      // FIXME: lanIp should look at LANDevice_1_IPStatus
      lanIp = eval('<!--#echo jsonvar="cli=LANDevice_1_IPInterface_1_IPAddress"-->'),
      lanIp6 = eval('<!--#echo jsonvar="cli=LANDevice_1_IPv6Status_CurrentIPAddress"-->'),
      localAddr = eval('<!--#echo jsonvar="cli=LANDevice_1_IPv6Status_CurrentLocalAddress"-->'),
      sysLang = eval('<!--#echo jsonvar="cli=Services_IADConfigurator_CurrentLanguage"-->'),
      
      pppCon = eval('(<!--#echo jsonvar="cli=WANConnectionDevice_1_WANPPPConnection"-->)'),
      pppStatus = eval('(<!--#echo jsonvar="cli=WANConnectionDevice_1_Status_LastConnectionError"-->)'),
      ipState = eval('(<!--#echo jsonvar="cli=WANConnectionDevice_1_Status_State"-->)'),

      wanPhyIf = eval('(<!--#echo jsonvar="cli=WANConnectionDevice_1_PhysicalInterface_1"-->)') ,
      wanEthEnable = wanPhyIf.Enable,
      ethLinkStatus = eval('(<!--#echo jsonvar="cli=LANEthernetInterface_{WANConnectionDevice_1_PhysicalInterface_1_Index}"-->)'),
      dslLinkStatus = eval('(<!--#echo jsonvar="cli=WANDSLLinkStatus_State"-->)'),
      ports,
      linkState,
      
      currLocation = window.location,
      queryString = currLocation.search,
      forwardUriQuery = queryString,
      currHost = currLocation.hostname.toLowerCase(),
      locPrefix = "http://" + hostName + "/" + sysLang + "/admin/",
      hostNameWithDomain = hostName + "." + domain;

      // if accessing lan address, no further checks needed
      // dns checks
      if(currHost === hostName.toLowerCase() || currHost === alises.toLowerCase() || currHost === hostNameWithDomain.toLowerCase()) {
         return;
      }
      // ipv4 check
      if(currHost === lanIp.toLowerCase()) {
         return;
      }
      // ipv6 checks
      if(currHost === lanIp6.toLowerCase() || currHost === localAddr.toLowerCase()) {
         return;
      }

      
      
      /* ------------------------------ Check if WAN Link is connected ------------------------- */
      if(wanEthEnable === "1") {
         ports = ethLinkStatus[wanPhyIf.Index].Port;
         linkState = (ports[5] || ports[1]).Status.LinkState;
         
         if(linkState !== 'Up') {
            currLocation.replace(locPrefix + "wanlink_down.htm");
            return;
         }
      }else{
         if(dslLinkStatus !== "Connected") {
            currLocation.replace(locPrefix + "wanlink_down.htm");
            return;
         }
      }
      
      /* ------------------------- Check if PPP connection is enabled -------------------------- */
      if(pppCon.Enable == 1) { // deliberate == check!
         if(!pppCon.Username && !pppCon.Password) {
            if(queryString.indexOf('?URI=') !== 0) {
               forwardUriQuery = '?URI=' + currLocation.hostname + '/' + currLocation.pathname + queryString;
            }      
            /* 
             * If ppp username and password are empty then this is first connection. 
             * Redirect user to a page so that he can enter ppp user name and password 
             */
            currLocation.replace(locPrefix + "first_connection.htm" + forwardUriQuery);
            return;
         }else if(pppStatus === 'Authentication Failed') {
            currLocation.replace(locPrefix + "ppp_auth_failed.htm");
            return;
         }
      }
      
      if (ipState != 'Up')
         currLocation.replace(locPrefix + "wangw_down.htm");
      else
      // lastly to to trouble shooting
         currLocation.replace(locPrefix + "troubleshooting.htm");
})();
