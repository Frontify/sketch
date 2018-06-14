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

    if (options.is_file_download) {
        // download file
        return new Promise(function (resolve, reject) {
            var task = NSTask.alloc().init();
            task.setLaunchPath("/usr/bin/curl");

            var args = [];

            // http method
            args.push('-X');
            args.push(options.method);
            args.push('-k');

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
                var errorString = NSString.alloc().initWithData_encoding(errorData, NSUTF8StringEncoding);
                console.log(errorString);
                reject('File download failed');
            }

        }.bind(this));
    }
    else if (options.is_file_upload) {
        // upload file
        return new Promise(function (resolve, reject) {
            var task = NSTask.alloc().init();
            task.setLaunchPath("/usr/bin/curl");

            var args = [];
            args.push('-k');

            // http headers
            for (var id in options.headers) {
                if (options.headers.hasOwnProperty(id)) {
                    var header = options.headers[id];
                    args.push('-H');
                    args.push('' + id + ': ' + header);
                }
            }

            // Form encoded params
            if (options.filepath) {
                args.push('-F');
                args.push('file=@' + options.filepath);
            }

            if (options.body) {
                var params = JSON.parse(options.body);

                for(var key in params) {
                    if(params.hasOwnProperty(key)) {
                        args.push('-F');
                        args.push(key + '=' + params[key]);
                    }
                }
            }

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
                var outputData = outputPipe.fileHandleForReading().readDataToEndOfFile();
                var outputString = NSString.alloc().initWithData_encoding(outputData, NSUTF8StringEncoding);
                resolve(JSON.parse(outputString));
            } else {
                var errorData = errorPipe.fileHandleForReading().readDataToEndOfFile();
                var errorString = NSString.alloc().initWithData_encoding(errorData, NSUTF8StringEncoding);
                console.log(errorString);
                reject('File Upload failed');
            }

        }.bind(this));
    }
    else {
        return fetch(token.domain + uri, options).then(function (response) {
            var contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                return response.json();
            }

            if (contentType && contentType.includes("text/html")) {
                return response.text();
            }

            throw new TypeError("Invalid response");
        }.bind(this)).catch(function (err) {
            if (err.localizedDescription) {
                console.error(err.localizedDescription);
            }
            else {
                console.error(err);
            }

            throw err;
        }.bind(this));
    }
}
