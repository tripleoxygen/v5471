#!/bin/ash
# 42k Series (C) 2016 Triple Oxygen
#
# $1 - RRD/data storage folder
# $2 - Stats output storage folder
# $3 - Subcarrier count

export LD_LIBRARY_PATH=/lib/public:/lib/private:/lib/gpl:/lib

xdslctl info --SNR  | tail -n +9 > "$1/snr_bin.data"
xdslctl info --Bits | tail -n +9 > "$1/bit_loading.data"

if [ ! -f "$1/bins.gp" ]; then
    echo "[42k] generate gnuplot config" | logger
    cp /etc/bewan/scripts/stats/bins.gp.tpl "$1/bins.gp"
    sed -i "s~{DATA_PATH}~$1~g" "$1/bins.gp"
    sed -i "s~{STATS_PATH}~$2~g" "$1/bins.gp"
    sed -i "s~{BIN_COUNT}~$3~g" "$1/bins.gp"
fi

gnuplot -c "$1/bins.gp"

echo "[42k] Subcarrier graphics" | logger

