var InternetConfigService = (function() {
    
    function Service(tkn) {
        var token = tkn, 
            cli = ConfigAccess(token),
            data,
            reads = [
                "WANDSLInterfaceConfig",
                "WANConnectionDevice_{Layer3Forwarding_ActiveConnectionService}:shadow",
                "WANConnectionDevice_{Layer3Forwarding_DefaultConnectionService}:shadow",
                "LANEthernetInterface",
                "ATMEthernetInterface"
            ];
            
        function checkState() {
            if(!data) {
                throw new Error("Service not initialized.");
            }
        }
            
        /**
         * Fetches the initial data required for this service
         */
        function fetchInitialData() {
            cli.rollback().read(reads)
                .commit(function(res) {
                    if(res.error) {
                        throw res.error;
                    }
                    data = {
                        WANDSLInterfaceConfig: res.WANDSLInterfaceConfig,
                        LANEthernetInterface: res.LANEthernetInterface,
                        ATMEthernetInterface: res.ATMEthernetInterface,
                        activeWANConnectionDevice: res["WANConnectionDevice_{Layer3Forwarding_ActiveConnectionService}:shadow"],
                        defaultWANConnectionDevice: res["WANConnectionDevice_{Layer3Forwarding_DefaultConnectionService}:shadow"]
                    };
                    
                    if(!data.activeWanConnectionDevice.List) {
                        dataata.activeWanConnectionDevice = dataata.defaultWanConnectionDevice;
                    }
                    
                });
        }
        
        /**
         * Gets the connection information for a given wan connection device (WANConnectionDevice)
         * @param {Object} wcd The CLI WANConnectionDevice object
         * @return {Object} The connection info object containing following properties:
         *  {
         *      ipAddress: IPv4 or IPv6 address of the device
         *      connectionType: One of ATM | PTM | Ethernet | Unknown
         *      linkUp: true | false
         *  }
         */
        function getConnectionInfo(wcd) {
            var wanIp = wcd.Status.IPAddress || wcd.Status.IP6Address,
                enabledPhyIntf = getEnabledPhysicalInterface(activeWanDevice), 
                physicalIntf, 
                netInfo = {
                    ipAddress: wanIp,
                    connectionType: "unknown",
                    linkUp: false
                };
                
            if(!enabledPhyIntf) {
                return netInfo;
            }

            physicalIntf = enabledPhyIntf.pIf;
            switch(physicalIntf.Type) {
                case "PTMEthernetInterface":
                    netInfo.connectionType = "PTM";
                    netInfo.linkUp = data.WANDSLLinkStatus.Status == 'Connected';
                    break;
                case "ATMEthernetInterface":
                    netInfo.connectionType = "ATM";
                    netInfo.linkUp = data.WANDSLLinkStatus.Status == 'Connected';
                    break;
                case "LANEthernetInterface":
                    netInfo.connectionType = 'Ethernet';
                    netInfo.linkUp = (data.LANEthernetInterface[physicalIntf.Index].Port[1].Status.LinkState === "Up");
                    break;
                default:
                    break;
            }
            return netInfo;
        }
        
        /**
         * Gets the first enabled physical interface of a given WAN device.
         * i.e. WANConnectionDevice_x_PhysicalInterface_x_Enable = 1
         * 
         * @param {String} wanConnectionDevice The CLI WANConnectionDevice Object
         * @return {Object} the CLI PhysicalInterface object.
         */
        function getEnabledPhysicalInterface(wanConnectionDevice) {
            var pIf, pIfList, ret;

            pIf = wanConnectionDevice.PhysicalInterface;
            pIfList = pIf.List.split(",");

            util.forEach(pIfList, function(pidx) {
                var p = pIf[pidx];
                if(p.Enable == 1) {
                    ret = {
                        id: pidx,
                        pIf: p
                    };
                    return util.Break;
                }
                return null;
            });
            return ret;
        }
        
        return {
            /**
             * Initialize this service with a specified token
             * @param {String} tkn The access token
             */
            init: function(tkn) {
                if(tkn) {
                    token = tkn;
                    cli = ConfigAccess(token);
                }
                fetchInitialData();
            },
            
            /**
             * Sets the connection mode to the specified mode.
             * @param {String} mode The connection mode. One of "DSL" | "Ethernet" | "Auto"
             * @param {Function} callback The callback to call setting the connection mode
             */
            setConnectionMode: function(mode, callback) {
                checkState();
            },
            
            /**
             * Gets the connection info object for WANConnectionDevice for active connection service as specified by
             * Layer3Forwarding_ActiveConnectionService
             * 
             * @return {Object} An object containing following properties
             *  {
             *      ipAddress: IPv4 or IPv6 address of the device
             *      connectionType: One of ATM | PTM | Ethernet | Unknown
             *      linkUp: true | false
             *  }
             */
            getActiveConnectionInfo: function() {
                checkState();
            },
            
            /**
             * Gets the connection info object for WANConnectionDevice for default connection service as specified by
             * Layer3Forwarding_DefaultConnectionService
             * 
             * @return {Object} An object containing following properties
             *  {
             *      ipAddress: IPv4 or IPv6 address of the device
             *      connectionType: One of ATM | PTM | Ethernet | Unknown
             *      linkUp: true | false
             *  }
             */
            getDefaultConnectionInfo: function() {
                checkState();
            }
        }
    }
    
    return Service;
    
})()