#!/bin/ash
# 42k Series (C) 2016 Triple Oxygen
#
# $1 - RRD/data storage folder
# $2 - Stats output storage folder
# $3 - Subcarrier count

rm "$2/graph_data.js"

rrdtool graph "$2/snr_margin_1h.png" \
        -w 560 -h 120 -a PNG \
        --slope-mode \
        --start end-1h \
        --end now \
        --font DEFAULT:8: \
        --title "Margem SNR (1 h)" \
        --watermark "`date` | 42k SERIES (c) 2016 TRIPLE OXYGEN" \
        --vertical-label "SNR (dB)" \
        --x-grid MINUTE:5:HOUR:1:MINUTE:10:0:%R \
        DEF:up="$1/snr_margin.rrd":up:AVERAGE \
        DEF:down="$1/snr_margin.rrd":down:AVERAGE \
        LINE2:up#0000FF:upstream \
        GPRINT:up:LAST:"(Atual\: %2.1lf dB)" \
        COMMENT:"       " \
        LINE2:down#FF0000:downstream \
        GPRINT:down:LAST:"(Atual\: %2.1lf dB)"

rrdtool graph "$2/snr_margin_24h.png" \
        -w 560 -h 120 -a PNG \
        --slope-mode \
        --start end-24h \
        --end now \
        --font DEFAULT:8: \
        --title "Margem SNR (24 h)" \
        --watermark "`date` | 42k SERIES (c) 2016 TRIPLE OXYGEN" \
        --vertical-label "SNR (dB)" \
        --x-grid MINUTE:120:HOUR:1:MINUTE:120:0:%R \
        DEF:up="$1/snr_margin.rrd":up:AVERAGE \
        DEF:down="$1/snr_margin.rrd":down:AVERAGE \
        LINE2:up#0000FF:"upstream  " \
        GPRINT:up:LAST:"Ultimo\: %2.1lf dB" \
        GPRINT:up:MIN:"Min\: %2.1lf dB" \
        GPRINT:up:MAX:"Max\: %2.1lf dB" \
        COMMENT:"\\n" \
        LINE2:down#FF0000:downstream \
        GPRINT:down:LAST:"Ultimo\: %2.1lf dB" \
        GPRINT:down:MIN:"Min\: %2.1lf dB" \
        GPRINT:down:MAX:"Max\: %2.1lf dB"

/etc/bewan/scripts/stats/graph_bins.sh "$1" "$2" "$3"

echo "var graphs_inited=1;" > "$2/graph_data.js"

echo "[42k] RRDTool & Bins graphs generated" | logger
