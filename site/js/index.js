function loadData(filter_params, callback) {
    var url = "http://ppr.local/api/properties.php";
    var query = "";
    if (filter_params) {
        if (filter_params.start_date) {
            query = "start_date=" + filter_params.start_date;
        }
        if (filter_params.end_date) {
            if (query.length != 0) {
                query += "&";
            }
            query += "end_date=" + filter_params.end_date;
        }
    }

    if (query.length > 0) {
        url = url + "?" + query;
    }
    alert(url);

    jQuery.get(url, function(response) {
            callback(response, null);
    });
}