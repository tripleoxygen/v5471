#!/bin/sh

# $1 = wan index
# $2 = destination ip address

[ "$1" = '' ] && return
[ "$2" = '' ] && return

wanid=$1
ipdest=$2

ipaddr=`cat /var/bewan/wan.d/$wanid/ip/ipaddr`
[ "$ipaddr" = '' ] && return
ipmask=`cat /var/bewan/wan.d/$wanid/ip/ipmask`
[ "$ipmask" = '' ] && return
ifname=`cat /var/bewan/wan.d/$wanid/ip/ifname`
[ "$ifname" = '' ] && return

ipnet=`ipnet "$ipaddr" "$ipmask"`
[ "$ipnet" = '' ] && return

dstnet=`ipnet "$ipdest" "$ipmask"`
[ "$dstnet" = '' ] && return
[ "$dstnet" != "$ipnet" ] && return
echo "$dstnet"
router=`cat /var/bewan/wan.d/$wanid/ip/routers`
[ "$router" = '' ] && return
gwmac=`cat /proc/net/arp | grep $router" " | grep $ifname | cut -c 42-58`
[ "$gwmac" = '' ] && return

arp -i $ifname -s $ipdest $gwmac

