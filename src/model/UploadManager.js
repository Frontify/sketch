import User from './user';

import response from '../helpers/response';

// Polyfills
import FormData from 'sketch-polyfill-fetch/lib/form-data';

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

export class UploadManager {
    constructor() {}
    uploadFile(info, overallProgress) {
        // remap slashes in filename to folders
        let filenameParts = info.filename.split('/');
        let filename = filenameParts.pop();

        let name = info.name.split('/').pop();

        // Attempt to encode slashes in a folder name with ":\" like macOS does it.
        // Apparently, the v1 API doesn’t seem to understand that and will just create a literal folder "/Slash:\in:\Folder" instead.

        // let hardcodedFolder = '/Slash/in/Folder/';
        // let pathWithoutLeadingAndTrailingSlash = hardcodedFolder.substring(1, hardcodedFolder.length - 1);

        // let wrappedFolder = `/${replaceAll(pathWithoutLeadingAndTrailingSlash, '/', `:\\`)}/`;
        // info.folder = wrappedFolder;

        // encodeURI() doesn’t seem to help: 3 folders will be created: ["Slash", "in", "Folder"]
        // info.folder = encodeURI(hardcodedFolder);

        let data = {
            name: name,
            filename: filename,
            origin: 'SKETCH',
            id_external: info.id_external,
        };

        if (info.pixel_ratio) {
            data.pixel_ratio = info.pixel_ratio;
        }

        let uri = '';
        let path = '';

        switch (info.type) {
            case 'attachment':
                data['mimetype'] = 'image/png';
                data['asset_id'] = info.asset_id;
                uri += '/v1/attachment/create';
                break;
            case 'source':
                path = filenameParts.join('/');
                data['mimetype'] = 'application/octet-stream';
                data['id'] = info.id;
                data['path'] = info.folder + path;
                data['project_id'] = info.project;

                uri += '/v1/assets/';
                if (info.id) {
                    uri += info.id;
                }
                break;
            case 'artboard':
                path = filenameParts.join('/');
                data['mimetype'] = 'image/png';
                data['id'] = info.id;
                data['path'] = info.folder + path;
                data['project_id'] = info.project;

                uri += '/v1/assets/';
                if (info.id) {
                    uri += info.id;
                }
                break;
        }

        let { domain, token } = User.getAuthentication();

        var options = {
            method: 'POST',
            filepath: info.path,
            type: info.type,
            id: info.id,
            body: data,
            headers: {
                Authorization: 'Bearer ' + token,
            },
        };

        // get token

        if (!uri) {
            return Promise.reject('Missing URL');
        }

        uri = domain + uri;

        var fiber;
        try {
            fiber = coscript.createFiber();
        } catch (err) {
            coscript.shouldKeepAround = true;
        }

        return new Promise(function (resolve, reject) {
            var url = NSURL.alloc().initWithString(uri);
            var request = NSMutableURLRequest.requestWithURL(url);
            request.setHTTPMethod('POST');

            Object.keys(options.headers || {}).forEach(function (i) {
                request.setValue_forHTTPHeaderField(options.headers[i], i);
            });

            let formData = new FormData();

            // Form encoded params
            if (options.filepath) {
                let attachment = {
                    fileName: options.body.filename,
                    mimeType: options.body.mimetype,
                    data: NSData.alloc().initWithContentsOfFile(options.filepath),
                };

                if (!attachment.data) {
                    console.error('Could not allocate file', options.filepath);
                    reject();
                }
                formData.append('file', attachment);
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

            request.setValue_forHTTPHeaderField('multipart/form-data; boundary=' + boundary, 'Content-Type');

            data.appendData(
                NSString.alloc()
                    .initWithString('--' + boundary + '--\r\n')
                    .dataUsingEncoding(NSUTF8StringEncoding)
            );

            var finished = false;

            var task = NSURLSession.sharedSession().uploadTaskWithRequest_fromData_completionHandler(
                request,
                data,
                __mocha__.createBlock_function(
                    'v32@?0@"NSData"8@"NSURLResponse"16@"NSError"24',
                    function (data, res, error) {
                        task.progress().setCompletedUnitCount(100);

                        if (fiber) {
                            fiber.cleanup();
                        } else {
                            coscript.shouldKeepAround = false;
                        }

                        /**
                         * It is possible that we attempt to upload an artboard with a given ID, that no longer exists on Frontify.
                         * In that case, the API (v1) does not return an error. Status code is 200, but the data is zero.
                         * So we have to check if there’s actual content in the returned data to know wether the upload was successful.
                         */

                        if (error) {
                            finished = true;
                            return reject(Error.UNKNOWN);
                        }

                        if (data.length() == 0) {
                            finished = true;
                            return reject(Error.ASSET_NOT_FOUND);
                        }

                        return resolve(response(res, data));
                    }
                )
            );

            task.resume();

            if (overallProgress && task) {
                overallProgress.addChild_withPendingUnitCount(task.progress(), 10);
            }

            if (fiber) {
                fiber.onCleanup(function () {
                    if (!finished) {
                        task.cancel();
                    }
                });
            }
        })
            .then(
                async function (response) {
                    return response.json();
                }.bind(this)
            )
            .catch(
                function (e) {
                    if (e?.localizedDescription) {
                        console.error(e.localizedDescription);
                    } else {
                        console.error(e);
                    }

                    throw e;
                }.bind(this)
            );
    }
}

export default new UploadManager();
