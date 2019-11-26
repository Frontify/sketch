export default function response(httpResponse, data) {
    var keys = [];
    var all = [];
    var headers = {};
    var header;

    for (var i = 0; i < httpResponse.allHeaderFields().allKeys().length; i++) {
        var key = httpResponse
            .allHeaderFields()
            .allKeys()
            [i].toLowerCase();
        var value = String(httpResponse.allHeaderFields()[key]);
        keys.push(key);
        all.push([key, value]);
        header = headers[key];
        headers[key] = header ? header + "," + value : value;
    }

    return {
        ok: ((httpResponse.statusCode() / 200) | 0) == 1, // 200-399
        status: Number(httpResponse.statusCode()),
        statusText: String(
            NSHTTPURLResponse.localizedStringForStatusCode(httpResponse.statusCode())
        ),
        useFinalURL: true,
        url: String(httpResponse.URL().absoluteString()),
        clone: response.bind(this, httpResponse, data),
        text: function() {
            return new Promise(function(resolve, reject) {
                const str = String(
                    NSString.alloc().initWithData_encoding(data, NSASCIIStringEncoding)
                );
                if (str) {
                    resolve(str);
                }
                else {
                    reject(new Error("Couldn't parse body"));
                }
            });
        },
        json: function() {
            return new Promise(function(resolve, reject) {
                var str = String(
                    NSString.alloc().initWithData_encoding(data, NSUTF8StringEncoding)
                );
                if (str) {
                    // parse errors are turned into exceptions, which cause promise to be rejected
                    var obj = JSON.parse(str);
                    resolve(obj);
                }
                else {
                    reject(
                        new Error(
                            "Could not parse JSON because it is not valid UTF-8 data."
                        )
                    );
                }
            });
        },
        blob: function() {
            return Promise.resolve(data);
        },
        arrayBuffer: function() {
            return Promise.resolve(Buffer.from(data));
        },
        headers: {
            keys: function() {
                return keys;
            },
            entries: function() {
                return all;
            },
            get: function(n) {
                return headers[n.toLowerCase()];
            },
            has: function(n) {
                return n.toLowerCase() in headers;
            }
        }
    };
}
