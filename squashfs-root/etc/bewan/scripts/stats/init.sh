#!/bin/ash
# 42k Series (C) 2016 Triple Oxygen

local RRD_PATH=${1:-}
[ "$RRD_PATH" = '' ] && exit 1

rrdtool create "$RRD_PATH/snr_margin.rrd" \
	--step 60 \
	--start N \
	DS:up:GAUGE:120:-60:60 \
	DS:down:GAUGE:120:-60:60 \
	RRA:AVERAGE:0.5:1:60 \
	RRA:AVERAGE:0.5:5:288
        
#rrdtool create "$RRD_PATH/output_power.rrd" \   
#        --step 60 \                         
#        --start N \                         
#        DS:up:GAUGE:120:-60:60 \
#        DS:down:GAUGE:120:-60:60 \
#        RRA:AVERAGE:0.5:1:60 \    
#        RRA:AVERAGE:0.5:5:288

#rrdtool create "$RRD_PATH/att.rrd" \   
#        --step 60 \                         
#        --start N \                         
#        DS:up:GAUGE:120:-60:60 \
#        DS:down:GAUGE:120:-60:60 \
#        RRA:AVERAGE:0.5:1:60 \    
#        RRA:AVERAGE:0.5:5:288
