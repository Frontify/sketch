import readJSON from './readJSON'
import extend from '../helpers/extend'
import fetch from 'sketch-polyfill-fetch'
import childProcess from '@skpm/child_process'
import { isWebviewPresent, sendToWebview } from 'sketch-module-web-view/remote'
import uploadFile from '../helpers/uploadFile'

export default function (uri, options) {
    // get token
    let token = readJSON('token');
    let defaults = {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token.access_token,
        }
    };

    options = extend({}, defaults, options);

    if (options.is_file_download) {
        // download file
        return new Promise(function (resolve, reject) {
            let args = [];

            // http method
            args.push('-X');
            args.push(options.method);
            args.push('-k');

            // http headers
            for (let id in options.headers) {
                if (options.headers.hasOwnProperty(id)) {
                    let header = options.headers[id];
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

            let spawn = childProcess.spawn('/usr/bin/curl', args);

            spawn.on('close', function(status) {
                if (status == 0) {
                    resolve(options.filepath);
                } else {
                    console.error('File download exited with status ' + status);
                    reject('File download failed');
                }
            }.bind(this));

            spawn.stderr.on('data', function(data) {
                data = data.toString();

                // get progress information
                let progress = parseInt(data.replace(/#*/gi, '').trim());

                if(options.type === 'source') {
                    if (isWebviewPresent('frontifymain')) {
                        sendToWebview('frontifymain', 'sourceDownloadProgress(' + JSON.stringify({ id: options.id, progress: progress }) + ')');
                    }
                }
            }.bind(this));
        }.bind(this));
    }
    else if (options.is_file_upload) {
        return uploadFile(token.domain + uri, options).then(function(response) {
            var json = response.json();
            return json;
        }.bind(this)).catch(function (e) {
            if (e.localizedDescription) {
                console.error(e.localizedDescription);
            }
            else {
                console.error(e);
            }

            throw e;
        }.bind(this));
    }
    else {
        if(!options.cdn) {
            uri = token.domain + uri;
        }

        return fetch(uri, options).then(function (response) {
            let contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                return response.json();
            }

            if (contentType && (contentType.includes("text/html") || contentType.includes("image/svg+xml"))) {
                return response.text();
            }

            throw new TypeError("Invalid response");
        }.bind(this)).catch(function (e) {
            // whitelist uris
            if (uri.indexOf('/v1/user/logout') > -1) {
                return '';
            }

            if (e.localizedDescription) {
                console.error(e.localizedDescription);
            }
            else {
                console.error(e);
            }

            throw e;
        }.bind(this));
    }
}
