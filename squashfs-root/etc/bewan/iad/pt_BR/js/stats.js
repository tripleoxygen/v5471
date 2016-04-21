function bandsToHtml(val) {
    return val.trim().slice(4).replace(/ /g, "<br/>");
}

function graphTag(path) {
    return "<img src=\"" + path + "\" />";
}

$.event.ready(function() {
    if (typeof stats_inited !== 'undefined') {
        $("#stats_bp_ds").html(bandsToHtml(stats_bp_ds));
        $("#stats_bp_us").html(bandsToHtml(stats_bp_us));
    }

    if (typeof graphs_inited !== 'undefined') {
        $("#graph_snr_1h").html(graphTag("/stats/snr_margin_1h.png"));
        $("#graph_snr_24h").html(graphTag("/stats/snr_margin_24h.png"));
        $("#graph_bins").html(graphTag("/stats/snr_bin.png"));
    }
});
