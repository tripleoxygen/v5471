var ApplicationList = (function($) {
    var util = $.util, Apps = {
        games: [
            {name:"Age of Empires (I. II & III)", protocols:{"tcp":"80,23,2300:2400,47624", "udp":"6073,2300:2400"}},
            {name:"Battlefield 1942", protocols:{"udp":"14567,14690,23000:23009"}},
            {name:"Battlefield 2", protocols:{"tcp":"80,4711,18060,28910,29900:29901,29920", "udp":"1500:4999,16567,18060,27900:27901,29900,29910,55123:55124,55215"}},
            {name:"Battlefield 2142", protocols:{"tcp":"80,443,1024:1124,4711,9960:9969,17475,18060,18120,18300,18510,27900,28910,29900", "udp":"1024:1124,1500:4999,9964,16567,18300,18510,27900:27901,28910,29900,55123"}},
            {name:"Brothers in Arms-Earned in Blood", protocols:{"tcp":"40000:43000", "udp":"44000,45000:45001"}},
            {name:"Call of Duty (I. II. Grande Offensive)", protocols:{"tcp":"28960", "udp":"20500,20510,20600,20610,28960"}},
            {name:"Championship Manager (3 & 4)", protocols:{"all":"9091:9092,9093:9094,6667"}},
            {name:"City of Heroes. City of Villains", protocols:{"tcp":"2104,2106,6994", "udp":"7000:7100"}},
            {name:"Command and Conquer", protocols:{"tcp":"3840,4005,4808,4810,4995,7000:7002,28910,29900,29920", "udp":"1234:1237,5009,4000,5400"}},
            {name:"Counter Strike", protocols:{"tcp":"27020:27039", "udp":"1200,27000:27015"}},
            {name:"Dark and Light", protocols:{"all":"6666,20013"}},
            {name:"Delta Force (1 & 2)", protocols:{"tcp":"3100,3999", "udp":"3100,3568,3569,3999"}},
            {name:"Doom 3", protocols:{"all":"27666,2765"}},
            {name:"Dungeon Siege (I & II)", protocols:{"udp":"2300:2400,6073"}},
            {name:"Dungeons & Dragons Online", protocols:{"tcp":"80", "udp":"2900:2910,9000:9010"}},
            {name:"Empire Earth (1 & 2)", protocols:{"tcp":"26000,33335:33336", "udp":"26000,33334"}},
            {name:"F.E.A.R.", protocols:{"all":"27888"}},
            {name:"Far Cry", protocols:{"tcp":"49001:49002", "udp":"49001:49002,49124"}},
            {name:"FIFA 2006", protocols:{"udp":"3658"}},
            {name:"FIFA 2007", protocols:{"tcp":"10400:10499", "udp":"3658"}},
            {name:"Flight Simulator (2002. 2004)", protocols:{"tcp":"2300:2400,47624", "udp":"2300:2400,6073,23456"}},
            {name:"Football Manager (2005. 2006. 2007)", protocols:{"all":"10093:10094"}},
            {name:"GameSpy Arcade", protocols:{"tcp":"6667,3783,27900,28900,29900,29901,13139,6515,6500"}},
            {name:"Ghost Recon Advanced War Fighter", protocols:{"tcp":"80,6667,28910,29900,29901,29920", "udp":"15250,13139,27900,27901,29910"}},
            {name:"GTA - Grand Theft Auto 2 Multiplayer", protocols:{"tcp":"2300:2400,47624,2003", "udp":"2300:2400,47624,2020,2003"}},
            {name:"GTR FIA GT Racing Game", protocols:{"tcp":"34347,34349", "udp":"34297:34300"}},
            {name:"Guild Wars", protocols:{"tcp":"80,6112"}},
            {name:"Half Life (1 & 2) Steam", protocols:{"tcp":"27020:27039", "udp":"1200,27000:27015"}},
            {name:"Halo", protocols:{"tcp":"80", "udp":"2302,2303"}},
            {name:"Lineage II", protocols:{"tcp":"80,2106,2009,7777", "udp":"53"}},
            {name:"Live For Speed Server", protocols:{"all":"29339,63392"}},
            {name:"Might and Magic Steam Client", protocols:{"tcp":"27015", "udp":"27015:27020"}},
            {name:"NBA Live 2006. 2007", protocols:{"udp":"957,3658,18699:28600"}},
            {name:"Need for Speed (Most Wanted & Carbon)", protocols:{"tcp":"80,13505,1030,9442", "udp":"3658,3659,30900:30999,1030,9442"}},
            {name:"Neverwinter Nights 1", protocols:{"udp":"5120:5300,6500,6667,27900,28900"}},
            {name:"Neverwinter Nights 2", protocols:{"udp":"5120:5300"}},
            {name:"NHL 2006", protocols:{"udp":"3658"}},
            {name:"PS3 Remote Play", protocols:{"tcp":"9293"}},
            {name:"Quake (2 & 3)", protocols:{"all":"27910,2796"}},
            {name:"Quake 4", protocols:{"all":"27650"}},
            {name:"Railroad Tycoon III", protocols:{"tcp":"6073,6500,9000"}},
            {name:"Rainbow Six 3 (incluant Athena Sword)", protocols:{"udp":"5777,6777,7777,7787,8777:8787"}},
            {name:"Rainbow Six 3 Raven Shield", protocols:{"udp":"7777:7787,8777:8787"}},
            {name:"Rainbow Six Lockdown", protocols:{"all":"2346:2348"}},
            {name:"Rainbow Six Vegas", protocols:{"tcp":"80,3074", "udp":"3074:3174"}},
            {name:"Rise of Legends", protocols:{"udp":"6112"}},
            {name:"Rogue Spear", protocols:{"all":"2346"}},
            {name:"Rome Total War", protocols:{"tcp":"3783,6500,6667,28900,29900:29901", "udp":"6515,13139,27750,27900"}},
            {name:"Silent Hunter III", protocols:{"all":"17997:18003"}},
            {name:"Socom 3", protocols:{"tcp":"80,10070:10080", "udp":"6000:7000,10070,50000"}},
            {name:"Soldiers- Heroes of World War II", protocols:{"udp":"2302,6073"}},
            {name:"Spellforce 2", protocols:{"udp":"2802:2803,30140"}},
            {name:"Splinter Cell : Chaos Theory", protocols:{"tcp":"40000:43000,9102,6668", "udp":"7776,8888:8891,8878,9102,9011,9103,9106,9107,41006,44000,45000,45001"}},
            {name:"Splinter Cell : Pandora Tomorrow", protocols:{"tcp":"40000:43000", "udp":"44000,45000,45001,7776,8888"}},
            {name:"Starwars Empire at War", protocols:{"all":"1234,3658:3660,6500,27900,28910,3783,6515,6667,13139,28900,29900:29901,29920"}},
            {name:"Stronghold 2 & Crusader", protocols:{"tcp":"2300:2400,47624,16699", "udp":"2300:2400"}},
            {name:"SWAT 4-The Stetchkov Syndicate", protocols:{"udp":"10480:10483"}},
            {name:"The Lord of the Rings-The Battle for Middle Earth", protocols:{"udp":"8088:28088"}},
            {name:"The Lord of the Rings-The Battle for Middle Earth II", protocols:{"udp":"8088:65535"}},
            {name:"The Lord of the Rings-War of the Ring", protocols:{"all":"6500,7175,13139"}},
            {name:"Tiger Woods PGA Tour 07", protocols:{"tcp":"80,443,13500:13599,32700:32799", "udp":"32768:65535,9570"}},
            {name:"Toca Race Driver 2", protocols:{"tcp":"10975", "udp":"1673,10975"}},
            {name:"Track Mania", protocols:{"all":"2350"}},
            {name:"Unreal Tournament 2004", protocols:{"all":"7777:7788,27900,42292"}},
            {name:"Virtual Skipper 3 & 4", protocols:{"all":"2350"}},
            {name:"Warhammer 40.000 : Dawn of War Host", protocols:{"udp":"6112"}},
            {name:"World of Warcraft Downloader", protocols:{"tcp":"3724,6112,6881:6999"}},
            {name:"Worms Armageddon", protocols:{"tcp":"80,6667,17010:17012"}},
            {name:"Xbox Live 360", protocols:{"tcp":"3074", "udp":"88,3074"}}
        ],

        communication: [
            {name:"AIM/ICQ", protocols:{"all":"5190"}},
            {name:"Cu-SeeMe", protocols:{"tcp":"1503,5222,5223,7648,7649", "udp":"7648,7649,24032"}},
            {name:"iChat", protocols:{"all":"4099,5190,5193"}},
            {name:"Jabber (inclus Google Talk)", protocols:{"tcp":"5222"}},
            {name:"mIRC - IRC", protocols:{"tcp":"10051:10070,113,6667", "udp":"113"}},
            {name:"MSN Messenger", protocols:{"tcp":"443,1863,6891:6900,6901", "udp":"6901"}},
            {name:"NetMeeting ", protocols:{"tcp":"522,389,1503,1720,1731", "udp":"1024:65535"}},
            {name:"TeamSpeak 2", protocols:{"tcp":"14534,51234", "udp":"8767"}},
            {name:"Xfire Chat", protocols:{"tcp":"25777"}},
            {name:"Yahoo Messenger", protocols:{"tcp":"80,5000:5001,5050,5100,5101", "udp":"5000:5010"}}
        ],

        internet: [
            {name:"Apple Remote Desktop", protocols:{"tcp":"3283,5900,5988", "udp":"3283"}},
            /* {name:"iTunes", protocols:{"tcp":"3689"}}, */
            {name:"pcAnywhere", protocols:{"all":"5631,5632"}},
            {name:"Remote Desktop", protocols:{"all":"3389"}},
            {name:"Remotely Anywhere", protocols:{"all":"2000"}},
            {name:"ShoutCast", protocols:{"all":"8000:8001"}},
            {name:"Winamp Audio Streaming", protocols:{"tcp":"8000:8001"}}
        ],

        servers: [
            {name:"FTP", protocols:{"tcp":"21"}},
            {name:"Imap", protocols:{"all":"143"}},
            {name:"Laplink", protocols:{"all":"1547,2705"}},
            {name:"MyDiskServer", protocols:{"tcp":"8088:8089"}},
            {name:"MySQL Server", protocols:{"all":"3306"}},
            {name:"POP3", protocols:{"all":"110"}},
            {name:"Web (HTTP (and HTTPS) Apache....)", protocols:{"tcp":"80,443"}},
            {name:"SMTP", protocols:{"all":"25"}},
            {name:"SSH", protocols:{"all":"22"}},
            {name:"TELNET", protocols:{"all":"23"}},
            {name:"VNC", protocols:{"all":"5500,5800,5900"}},
            {name:"Windows Media Server", protocols:{"tcp":"3690"}}
        ]
    },
    
    allApps = {};
    
    (function init() {
        util.forEach(["games", "communication", "internet", "servers"], function(catName) {
            var category = Apps[catName];
            util.forEach(category, function(app) {
                app.category = catName;
                allApps[app.name] = app;
            });
        });
    })();
    
    return {
        findApplication: function(name) {
            return allApps[name];
        },
        
        getCategories: function() {
            return [
                {name: "games", label: "Games"},
                {name: "communication", label: "Communication"},
                {name: "internet", label: "Internet"},
                {name: "servers", label: "Servers"}
            ]
        },
        
        getApps: function(category) {
            return Apps[category] || [];
        }
    }
    
})(lite);