function handler(event) {
    var request = event.request;
    var uri = request.uri;
    var host = request.headers.host && request.headers.host.value;

    if (host === "www.restaurant-maseltopf.de") {
        var query = "";
        for (var name in request.querystring) {
            var item = request.querystring[name];
            var values = item.multiValue || [{ value: item.value }];
            for (var i = 0; i < values.length; i++) {
                query +=
                    (query ? "&" : "?") +
                    encodeURIComponent(name) +
                    (values[i].value ? "=" + encodeURIComponent(values[i].value) : "");
            }
        }

        return {
            statusCode: 301,
            statusDescription: "Moved Permanently",
            headers: {
                location: {
                    value: "https://restaurant-maseltopf.de" + uri + query,
                },
            },
        };
    }

    if (uri.length > 1 && uri.endsWith("/")) {
        return {
            statusCode: 301,
            statusDescription: "Moved Permanently",
            headers: { location: { value: uri.slice(0, -1) } },
        };
    }

    if (uri === "/") {
        request.uri = "/index.html";
        return request;
    }

    var last = uri.slice(uri.lastIndexOf("/") + 1);
    if (last.indexOf(".") === -1) request.uri = uri + "/index.html";

    return request;
}
