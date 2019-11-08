import FormData from 'sketch-polyfill-fetch/lib/form-data';
let ObjCClass = require('cocoascript-class').default;
let ProgressObserver = ObjCClass({
    classname: 'ProgressObserver',
    init: function() {
        this.progress = null;
    },
    'observeValueForKeyPath:ofObject:change:context:': function(value){
        console.log(value);
        console.log('observing changes');
    },
    register: function(progress) {
        console.log('register');
        this.progress = progress;
        this.progress.addObserver_forKeyPath_options_context(this, 'fractionCompleted', [], nil);
        console.log('registered');
    },
    deregister: function() {
        console.log('deregister');
        console.log(this.progress);
        if(this.progress) {
            this.progress.removeObserver_forKeyPath_(this, 'fractionCompleted');
        }
        console.log('deregistered');
    }
});

function response(httpResponse, data) {
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


function uploadFile(urlString, options) {
    if (
        typeof urlString === "object" &&
        (!urlString.isKindOfClass || !urlString.isKindOfClass(NSString))
    ) {
        options = urlString;
        urlString = options.url;
    }
    options = options || {};
    if (!urlString) {
        return Promise.reject("Missing URL");
    }

    var fiber;
    try {
        fiber = coscript.createFiber();
    } catch (err) {
        coscript.shouldKeepAround = true;
    }

    return new Promise(function(resolve, reject) {
        var url = NSURL.alloc().initWithString(urlString);
        var request = NSMutableURLRequest.requestWithURL(url);
        request.setHTTPMethod("POST");

        Object.keys(options.headers || {}).forEach(function(i) {
            request.setValue_forHTTPHeaderField(options.headers[i], i);
        });

        let formData = new FormData();

        // Form encoded params
        if (options.filepath) {
            formData.append('file', {
                fileName: options.body.filename,
                mimeType: options.body.mimetype,
                data: NSData.alloc().initWithContentsOfFile(options.filepath)
            });
        }

        if (options.body) {
            let params = options.body;

            for (let key in params) {
                if (params.hasOwnProperty(key)) {
                    formData.append(key, '' + params[key]);
                }
            }
        }

        var data = formData._data;
        var boundary = formData._boundary;

        request.setValue_forHTTPHeaderField(
            "multipart/form-data; boundary=" + boundary,
            "Content-Type"
        );

        data.appendData(
            NSString.alloc()
                .initWithString("--" + boundary + "--\r\n")
                .dataUsingEncoding(NSUTF8StringEncoding)
        );

        var finished = false;

        var task = NSURLSession.sharedSession().uploadTaskWithRequest_fromData_completionHandler(
            request,
            data,
            __mocha__.createBlock_function(
                'v32@?0@"NSData"8@"NSURLResponse"16@"NSError"24',
                function(data, res, error) {
                    console.log(error);
                    console.log('done');
                    console.log(progressObserver);

                    progressObserver.deregister();
                    progressObserver = nil;

                    if (fiber) {
                        fiber.cleanup();
                    }
                    else {
                        coscript.shouldKeepAround = false;
                    }

                    if (error) {
                        finished = true;
                        return reject(error);
                    }
                    return resolve(response(res, data));
                }
            )
        );

        task.resume();

        let progressObserver = ProgressObserver.new();
        let progress = task.progress();

        console.log(progressObserver);

        progressObserver.register(progress);

        console.log('added');

        if (fiber) {
            fiber.onCleanup(function() {
                if (!finished) {
                    task.cancel();
                }
            });
        }
    });
}

export default uploadFile;
