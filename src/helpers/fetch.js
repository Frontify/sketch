import readJSON from './readJSON'
import extend from '../helpers/extend'
import fetch from 'sketch-polyfill-fetch'
import childProcess from '@skpm/child_process';

var threadDictionary = NSThread.mainThread().threadDictionary();

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

            // display progress
            args.push('-#');

            // uri
            args.push(token.domain + uri);

            var spawn = childProcess.spawn('/usr/bin/curl', args);

            spawn.on('close', function(status) {
                if (status == 0) {
                    resolve(options.filepath);
                } else {
                    console.log('File download exited with status ' + status);
                    reject('File download failed');
                }
            }.bind(this));

            spawn.stderr.on('data', function(data) {
                // get progress information
                var progress = parseInt(data.replace(/#*/gi, '').trim());

                if(options.type === 'source') {
                    if(threadDictionary['frontifywindow'] && threadDictionary['frontifywindow'].webContents) {
                        threadDictionary['frontifywindow'].webContents.executeJavaScript('sourceDownloadProgress(' + JSON.stringify({ id: options.id, progress: progress }) + ')');
                    }
                }
            }.bind(this));
        }.bind(this));
    }
    else if (options.is_file_upload) {
        // upload file
        return new Promise(function (resolve, reject) {

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

            // display progress
            args.push('-#');

            // uri
            args.push(token.domain + uri);

            var spawn = childProcess.spawn('/usr/bin/curl', args);
            var result = "";

            spawn.on('close', function(status) {
                if (status == 0) {
                    resolve(JSON.parse(result));
                } else {
                    console.log('File upload exited with status ' + status);
                    reject('File Upload failed');
                }
            }.bind(this));

            spawn.stdout.on('data', function(data) {
                result += data.toString();
            }.bind(this));

            spawn.stderr.on('data', function(data) {
                // get progress information
                var progress = parseInt(data.replace(/#*/gi, '').trim());

                if(threadDictionary['frontifywindow'] && threadDictionary['frontifywindow'].webContents) {
                    if(options.type === 'source') {
                        threadDictionary['frontifywindow'].webContents.executeJavaScript('sourceUploadProgress(' + JSON.stringify({ id: options.id, id_external: options.id_external, progress: progress }) + ')');
                    }
                    else if(options.type === 'artboard') {
                        threadDictionary['frontifywindow'].webContents.executeJavaScript('artboardUploadProgress(' + JSON.stringify({ id: options.id,  id_external: options.id_external, progress: progress }) + ')');
                    }
                }
            }.bind(this));
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
