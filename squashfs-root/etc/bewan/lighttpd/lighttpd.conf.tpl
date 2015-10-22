
debug.log-request-handling = "<req-hdl/>"
debug.log-request-header = "<req-hdr/>"
debug.log-response-header = "<rsp-hdr/>"
debug.log-condition-handling = "<rsp-hdl/>"

server.errorlog-use-syslog = "<uselog/>"
accesslog.use-syslog       = "<accesslog/>"

#Server Document Root
server.document-root  = "<doc_root/>"

## 64 Mbyte ... nice limit : recommanded by lighttpd
## Take care of post size limit wich can be over 10MB (updload firmware)
server.max-request-size = 0

server.use-ipv6		    =  "enable"
server.pid-file             = "<pidfile/>"
server.name="lighty-lighty-"
<serverbind/>
server.port = <port/>
server.tag                 = "Apache 1.3.29"
compress.filetype           = ("text/plain", "text/html")
#Modules Config
server.modules              = (
				"mod_rewrite",
#				"mod_setenv",
#				"mod_secdownload",
#			  "mod_access",
			  "mod_alias",
				"mod_webauth",
#				"mod_httptls",
#				"mod_status",
				"mod_expire",
#				"mod_simple_vhost",
#				"mod_redirect",
#				"mod_evhost",
#				"mod_localizer",
				"mod_fastcgi",
				"mod_cgi",
				"mod_compress",
#				"mod_userdir",
#				"mod_ssi",
				"mod_accesslog",
				"mod_extforward",
)

server.indexfiles           = ( "index.htm", "default.htm" )
ssl.engine                  = "disable"

server.upload-dirs = ( "/var/tmp" )

mimetype.assign = (
  ".txt" => "text/plain",
  ".jpg" => "image/jpeg",
  ".png" => "image/png",
  ".gif" => "image/gif",
   ".css" => "text/css",
  ".javascript" => "application/x-javascript",
)
# Chargement du module cgi
#remove if present
ssi_ext = "htm|xml|js|cgi|cgi"
alias.url += ( "/cgi-bin" => server.document-root + "/cgi-bin" )
#escape $ here

fastcgi.map-extensions = ( 
".xml" => ".htm",
".js" => ".htm",
".cgi" => ".htm",
)
srv_env = (
    "BEWAN_SRV_IDX" => "<srv_idx/>",
    "BEWAN_REALM" => "<realm/>",
)

srv0 = ( 
     "socket" => "/var/tmp/fcgi.sock0",
     "bin-path" =>"<doc_root/>/ssi",
     "max-procs" => 1,
     "min-procs" => 1,
     "check-local" => "disable",
     "web-srv-env" => srv_env,
     "allow-x-send-file" => "enable",
)
srv1 = ( 
     "socket" => "/var/tmp/fcgi.sock1",
     "bin-path" =>"<doc_root/>/ssi",
     "max-procs" => 1,
     "min-procs" => 1,
     "check-local" => "disable",
     "web-srv-env" => srv_env,
     "allow-x-send-file" => "enable",
)
srv2 = ( 
     "socket" => "/var/tmp/fcgi.sock2",
     "bin-path" =>"<doc_root/>/ssi",
     "max-procs" => 1,
     "min-procs" => 1,
     "check-local" => "disable",
     "web-srv-env" => srv_env,
     "allow-x-send-file" => "enable",
)
srv3 = ( 
     "socket" => "/var/tmp/fcgi.sock3",
     "bin-path" =>"<doc_root/>/ssi",
     "max-procs" => 1,
     "min-procs" => 1,
     "check-local" => "disable",
     "web-srv-env" => srv_env,
     "allow-x-send-file" => "enable",
)
fastcgi.server = ( ".htm" => (srv0,srv1,srv2,srv3,) )
webauth.realm   = "<realm/>"

server.network-backend = "writev"
server.event-handler = "select"

extforward.forwarder = (                                    
     "127.0.0.1" => "trust"
)       


