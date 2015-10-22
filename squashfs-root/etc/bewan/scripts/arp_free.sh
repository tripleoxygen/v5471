#!/bin/sh

# $1 = destination ip address

[ "$1" = '' ] && return
[ "$2" = '' ] && return

wanid=$1
ipdest=$2

ifname=$(cat /var/bewan/wan.d/$wanid/ip/ifname)
[ "$ifname" = '' ] && return

arp -i $ifname -d $ipdest

