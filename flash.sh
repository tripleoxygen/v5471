#!/bin/bash

[[ "$#" -lt 1 ]] && {
    echo "flash.sh <image>"
    exit
}

curl -H "Expect:" "http://192.168.25.1/cgi-bin/firmware.cgi" -F sFirmwareFile=@$1

