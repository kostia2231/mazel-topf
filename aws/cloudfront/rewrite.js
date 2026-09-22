function handler(event) {
    var request = event.request;
    var uri = request.uri;

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
