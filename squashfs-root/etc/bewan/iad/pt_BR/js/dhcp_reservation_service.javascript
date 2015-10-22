var DHCPReservationService = (function($) {
    var util = $.util, forEach = util.forEach, isTypeOf = util.isTypeOf;
    
    function Service(token, lanIndex, dhcpLeases) {
        var cli = ConfigAccess(token),
            allLeases = {},
            lanid = lanIndex,
            lastIndex = 1000;
        
        function initReservations(reservations) {
            var clientTableList = reservations.List ? reservations.List.split(",") : [];
            forEach(clientTableList, function(idx) {
                var reserv = reservations[idx], index = Number(idx);
                
                if(lastIndex < index) {
                    lastIndex = index;
                }
                
                reserv._index = index;
                allLeases[reserv.MACAddress] = reserv;
            });
            
            console.log("Last index: " + lastIndex);
        }
        
        initReservations(dhcpLeases);
        
        return {
            hasReservation: function(mac) {
                return allLeases[mac] !== null;
            },
            
            getReservationForIp: function(ip) {
                var found = null;
                forEach(allLeases, function(l) {
                    if(l.IPAddress === ip) {
                        found = l;
                        return util.Break;
                    }
                    return null;
                });
                return found;
            },
            
            addReservation: function(reserv, callback) {
                if(! isTypeOf(reserv, "Array")) {
                    reserv = [reserv]
                }
                
                cli.rollback();
                forEach(reserv, function(l, i) {
                    var mac = l.MACAddress, existing = allLeases[mac], tmpLeases = {}, prefix;
                    
                    if(!existing) {
                        l._index = ++lastIndex;
                        console.log("Creating new reservation for " + mac);
                        if ( ! confirm('Isto irá criar uma nova reserva na tabela, deseja continuar?')) return; 
                    }else {
                        console.log("Updating existing reservation for " + mac);
                        l._index = existing._index;
                    }
                    
                    tmpLeases[mac] = l;
                    
                    prefix = ["LANDevice", lanid, "HostConfig", "ClientTable", l._index].join("_") + "_";
                    forEach(l, function(val, prop) {
                        if(prop !== "_index") {
                            cli.write(prefix + prop, val);
                        }
                    });
                    
                    cli.commit(function(res) {
                        if(!res.error) {
                            forEach(tmpLeases, function(addedLease, mac) {
                                allLeases[mac] = addedLease;
                            });
                        }
                        if(typeof callback === "function") {
                            callback(res, reserv);
                        }
                    });
                    
                    
                });
            },
            
            removeReservation: function(mac, callback) {
                var doCommit = false;
                if(!isTypeOf(mac, "Array")) {
                    mac = [mac];
                }
                
                cli.rollback();
                forEach(mac, function(macAddr) {
                    var oldLease = allLeases[macAddr], prefix;
                    if(oldLease) {
                        cli.remove(["LANDevice", lanid, "HostConfig", "ClientTable", oldLease._index].join("_"));
                        doCommit = true;
                    }
                });
                if(!doCommit) {
                    console.log("No reservations to remove");
                    return;
                }
                
                cli.commit(function(res) {
                    if(!res.error) {
                        forEach(mac, function(m) {
                            delete allLeases[m];
                        });
                    }
                    
                    if(typeof callback === "function") {
                        callback(res, mac);
                    }
                });
            },
            
            getAllReservations: function() {
                var reservations = [];
                forEach(allLeases, function(l, mac) {
                    reservations[reservations.length] = l;
                });
                return reservations;
            },
            
            refreshReservations: function(lanId, callback) {
                var prefix = ["LANDevice", lanId, "HostConfig", "ClientTable"].join("_");
                lanid = lanId;
                
                cli.rollback().read(prefix).commit(function(res) {
                    allLeases = {};
                    if(!res.error) {
                        initLeases(res[prefix]);
                    }
                    callback(res);
                });
            }
        }
    }
    
    return Service;
})(lite);