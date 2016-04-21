#!/bin/ash
# 42k Series (C) 2016 Triple Oxygen

export LD_LIBRARY_PATH=/lib/public:/lib/private:/lib/gpl:/lib

OUTPUT=$(xdslinfo | grep "noise margin")
SNR=$(echo $OUTPUT | awk '{ print $6 ":" $12 }')
rrdtool update "$1/snr_margin.rrd" --template up:down N:$SNR

echo "[42k] RRDTool update done" | logger
