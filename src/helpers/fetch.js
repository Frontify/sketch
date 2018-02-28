import readJSON from './readJSON'
import extend from '../helpers/extend'
import fetch from 'sketch-polyfill-fetch'

export default function (uri, options) {
    // get token
    var token = readJSON('token');
    var defaults = {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token.access_token,
        }
    };

    options = extend({}, defaults, options);

    if (!options.is_file) {
        return fetch(token.domain + uri, options).then(function (response) {
            var contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                return response.json();
            }

            var contentDisposition = response.headers.get("content-disposition");
            if (contentDisposition && contentDisposition.indexOf('attachment') !== false) {
                return response.blob();
            }

            throw new TypeError("Oops, we haven't got JSON!");
        }.bind(this)).catch(function (err) {
            if (err.localizedDescription) {
                console.error(err.localizedDescription);
            }
            else {
                console.error(err);
            }
        }.bind(this));

    }
    else if (options.is_file && options.filepath) {
        return new Promise(function (resolve, reject) {
            var task = NSTask.alloc().init();
            task.setLaunchPath("/usr/bin/curl");

            var args = [];

            // http method
            args.push('-X');
            args.push(options.method);

            // http headers
            for (var id in options.headers) {
                if (options.headers.hasOwnProperty(id)) {
                    var header = options.headers[id];
                    args.push('-H');
                    args.push('' + id + ': ' + header);
                }
            }

            // body
            if (options.body) {
                args.push('-H');
                args.push('Content-Type: application/json');
                args.push('-d');
                args.push(options.body);
            }

            args.push('-o');
            args.push(options.filepath);

            // uri
            args.push(token.domain + uri);

            task.setArguments(args);

            var outputPipe = NSPipe.pipe();
            var errorPipe = NSPipe.pipe();

            task.setStandardOutput(outputPipe);
            task.setStandardError(errorPipe);
            task.launch();
            task.waitUntilExit();

            var status = task.terminationStatus();

            if (status == 0) {
                resolve(options.filepath);
            } else {
                var errorData = errorPipe.fileHandleForReading().readDataToEndOfFile();
                var errorString = NSString.alloc().init();
                errorString.initWithData_encoding(errorData, NSUTF8StringEncoding);
                reject('upload failed');
            }

        }.bind(this));
    }
}
