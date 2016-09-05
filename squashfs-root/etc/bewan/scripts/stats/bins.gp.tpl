set terminal png size 665,200 font "/usr/share/rrdtool/fonts/DejaVuSansMono-Roman.ttf,8" background rgbcolor "#f0f0f0"
set output "{STATS_PATH}/snr_bin.png"
set label "42k SERIES (c) 2016 TRIPLE OXYGEN" right at screen 1, screen 0.04 tc rgbcolor "#a0a0a0"
set xrange [0:{BIN_COUNT}-1]
set xlabel "Subportadora"
set xtics {BIN_COUNT}/8
set grid 
set timestamp
plot    "{DATA_PATH}/snr_bin.data" with boxes t "SNR Margin/bin" lc rgbcolor "#a0a0a0", \
        "{DATA_PATH}/bit_loading.data" with boxes t "Bit loading" lc rgbcolor "#e57317"
