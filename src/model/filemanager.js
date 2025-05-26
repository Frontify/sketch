import readJSON from '../helpers/readJSON';
import writeJSON from '../helpers/writeJSON';
import fetch from '../helpers/fetch';
import createFolder from '../helpers/createFolder';
import target from './target';
import sketch from './sketch';
import FormData from 'sketch-polyfill-fetch/lib/form-data';
import extend from '../helpers/extend';
import response from '../helpers/response';

class FileManager {
    constructor() {
        this.exportPath = NSTemporaryDirectory() + 'sketch-frontify/';
    }

    logRequest(message, data) {
        console.log('[FRONTIFY REQUEST] ' + message);

        if (data) {
            try {
                console.log(JSON.stringify(data, null, 2));
            } catch (e) {
                console.log('Could not stringify data: ' + e.message);
                console.log(data);
            }
        }
    }

    getExportPath() {
        return this.exportPath;
    }

    isCurrentSaved() {
        return !!sketch.getDocument().fileURL();
    }

    saveCurrent() {
        return target.getTarget('sources').then(
            function (data) {
                // create folder first
                if (createFolder(data.path)) {
                    let dialog = NSSavePanel.savePanel();
                    dialog.canCreateDirectories = false;
                    dialog.directoryURL = NSURL.fileURLWithPath(data.path);
                    dialog.allowedFileTypes = ['sketch'];
                    dialog.message = 'Save your Sketch File in the Frontify sync folder';

                    let clicked = dialog.runModal();

                    if (clicked == NSOKButton) {
                        let url = dialog.URL();
                        let doc = sketch.getDocument();

                        if (doc) {
                            doc.saveToURL_ofType_forSaveOperation_error_(
                                url,
                                'com.bohemiancoding.sketch.drawing',
                                NSSaveOperation,
                                null,
                            );
                        }

                        return true;
                    } else {
                        return false;
                    }
                }

                return false;
            }.bind(this),
        );
    }

    moveCurrent() {
        return target.getTarget('sources').then(
            function (data) {
                if (createFolder(data.path)) {
                    let doc = sketch.getDocument();

                    if (doc) {
                        let nsurl = doc.fileURL();
                        let path = nsurl.path();
                        let parts = path.split('/');
                        let currentFilename = parts.pop();
                        let newNsurl = NSURL.fileURLWithPath(data.path + currentFilename);

                        // move to the target folder
                        doc.moveToURL_completionHandler_(newNsurl, null);
                    }

                    return true;
                }

                return false;
            }.bind(this),
        );
    }

    updateAssetStatus(project, asset) {
        let status = readJSON('sources-' + project) || {};
        status.assets = status.assets || {};
        status.assets[asset.id] = status.assets[asset.id] || {};
        status.assets[asset.id].id = asset.id;
        status.assets[asset.id].modified = asset.modified;
        status.assets[asset.id].modifier_email = asset.modifier_email;
        status.assets[asset.id].modifier_name = asset.modifier_name;
        status.assets[asset.id].sha = asset.sha;
        writeJSON('sources-' + project, status);
    }

    updateArtboardStatus(project, artboard) {
        let status = readJSON('artboards-' + project) || {};
        status.artboards = status.artboards || {};
        status.artboards[artboard.id] = status.artboards[artboard.id] || null;
        status.artboards[artboard.id] = artboard.sha;
        writeJSON('artboards-' + project, status);
    }

    openFile(path) {
        NSWorkspace.sharedWorkspace().openFile(path);
    }

    deleteFile(path) {
        let fileManager = NSFileManager.defaultManager();
        fileManager.removeItemAtPath_error(path, nil);
    }

    clearExportFolder() {
        let fileManager = NSFileManager.defaultManager();
        fileManager.removeItemAtPath_error(this.exportPath, nil);
    }

    uploadFile(info, overallProgress) {
        // Debug log the upload info
        this.logRequest('Starting upload for:', info);

        // Ensure export directory exists
        const fileManager = NSFileManager.defaultManager();
        if (!fileManager.fileExistsAtPath(this.exportPath)) {
            try {
                fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(
                    this.exportPath,
                    true,
                    nil,
                    nil,
                );
                this.logRequest('Created export directory');
            } catch (e) {
                this.logRequest('Error creating export directory: ' + e.message);
            }
        }

        // Check file exists and has content
        if (info.path) {
            if (!fileManager.fileExistsAtPath(info.path)) {
                this.logRequest("ERROR: File doesn't exist at path: " + info.path);
                return Promise.reject(new Error("File doesn't exist at path: " + info.path));
            }

            const fileAttributes = fileManager.attributesOfItemAtPath_error(info.path, nil);
            const fileSize = fileAttributes ? Number(fileAttributes.fileSize()) : 0;
            this.logRequest('File size: ' + fileSize + ' bytes');

            if (fileSize <= 0) {
                this.logRequest('ERROR: File is empty or inaccessible');
                return Promise.reject(new Error('File is empty or inaccessible: ' + info.path));
            }
        } else {
            this.logRequest('ERROR: No file path provided');
            return Promise.reject(new Error('No file path provided'));
        }

        // remap slashes in filename to folders
        let filenameParts = info.filename.split('/');
        let filename = filenameParts.pop();

        let name = info.name.split('/').pop();

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

        if (info.type === 'attachment') {
            data['mimetype'] = 'image/png';
            data['asset_id'] = info.asset_id;
            uri += '/v1/attachment/create';
            this.logRequest('Attachment URI: ' + uri);
        } else if (info.type === 'source') {
            let path = filenameParts.join('/');
            data['mimetype'] = 'application/octet-stream';
            data['id'] = info.id;
            data['path'] = info.folder + path;
            data['project_id'] = info.project;

            uri += '/v1/assets'; // Remove trailing slash
            if (info.id) {
                uri += '/' + info.id; // Add slash before ID
            }
            this.logRequest('Source URI: ' + uri);
        } else {
            let path = filenameParts.join('/');
            data['mimetype'] = 'image/png';
            data['id'] = info.id;
            data['path'] = info.folder + path;
            data['project_id'] = info.project;

            uri += '/v1/assets'; // Remove trailing slash
            if (info.id) {
                uri += '/' + info.id; // Add slash before ID
            }
            this.logRequest('Asset URI: ' + uri);
        }

        var options = {
            method: 'POST',
            filepath: info.path,
            type: info.type,
            id: info.id,
            body: data,
        };

        // get token
        let token = readJSON('token');
        let defaults = {
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + token.access_token,
            },
        };

        options = extend({}, defaults, options);

        if (!uri) {
            this.logRequest('ERROR: Missing URL');
            return Promise.reject('Missing URL');
        }

        uri = token.domain + uri;
        this.logRequest('Full request URI: ' + uri);

        var fiber;
        try {
            fiber = coscript.createFiber();
        } catch (err) {
            coscript.shouldKeepAround = true;
        }

        return new Promise(
            function (resolve, reject) {
                var url = NSURL.alloc().initWithString(uri);
                var request = NSMutableURLRequest.requestWithURL(url);
                request.setHTTPMethod('POST');

                Object.keys(options.headers || {}).forEach(function (i) {
                    request.setValue_forHTTPHeaderField(options.headers[i], i);
                });

                let formData = new FormData();

                // Form encoded params
                if (options.filepath) {
                    this.logRequest('Preparing file: ' + options.filepath);

                    try {
                        // Read file data
                        const fileData = NSData.alloc().initWithContentsOfFile(options.filepath);

                        if (!fileData) {
                            this.logRequest('ERROR: Failed to read file data');
                            return reject(new Error('Failed to read file data from: ' + options.filepath));
                        }

                        this.logRequest('Successfully read file data: ' + fileData.length() + ' bytes');

                        formData.append('file', {
                            fileName: options.body.filename,
                            mimeType: options.body.mimetype,
                            data: fileData,
                        });

                        this.logRequest('File appended to form data with name: ' + options.body.filename);
                    } catch (e) {
                        this.logRequest('ERROR reading file: ' + e.message);
                        return reject(new Error('Error reading file: ' + e.message));
                    }
                }

                if (options.body) {
                    let params = options.body;
                    this.logRequest('Form parameters:', params);

                    for (let key in params) {
                        if (params.hasOwnProperty(key)) {
                            try {
                                formData.append(key, '' + params[key]);
                                this.logRequest(`Added parameter ${key}: ${params[key]}`);
                            } catch (e) {
                                this.logRequest(`Error adding parameter ${key}: ${e.message}`);
                            }
                        }
                    }
                }

                var data = formData._data;
                var boundary = formData._boundary;

                request.setValue_forHTTPHeaderField('multipart/form-data; boundary=' + boundary, 'Content-Type');

                // Add boundary terminator
                data.appendData(
                    NSString.alloc()
                        .initWithString('--' + boundary + '--\r\n')
                        .dataUsingEncoding(NSUTF8StringEncoding),
                );

                var finished = false;

                this.logRequest('Beginning upload task with content length: ' + data.length() + ' bytes');

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

                            if (error) {
                                this.logRequest('Upload task error:', error);
                                finished = true;
                                return reject(error);
                            }

                            return resolve(response(res, data));
                        }.bind(this),
                    ),
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
            }.bind(this),
        )
            .then(
                function (response) {
                    this.logRequest('Upload response received');
                    return response.json();
                }.bind(this),
            )
            .then(
                function (jsonData) {
                    this.logRequest('JSON response:', jsonData);
                    return jsonData;
                }.bind(this),
            )
            .catch(
                function (e) {
                    this.logRequest('Upload ERROR:', e);

                    if (e.localizedDescription) {
                        console.error(e.localizedDescription);
                    } else {
                        console.error(e);
                    }

                    // Try to get more details from the error
                    try {
                        for (let prop in e) {
                            if (e.hasOwnProperty(prop)) {
                                this.logRequest('Error property [' + prop + ']:', e[prop]);
                            }
                        }

                        if (e.response) {
                            this.logRequest('Response error:', e.response);
                        }
                    } catch (inspectErr) {
                        this.logRequest('Error while inspecting error:', inspectErr.message);
                    }

                    throw e;
                }.bind(this),
            );
    }

    downloadScreen(info, overallProgress) {
        return fetch('/v1/screen/modified/' + info.id).then(
            function (meta) {
                this.updateAssetStatus(meta.screen.project, meta.screen);

                return target.getTarget('sources').then(
                    function (target) {
                        if (createFolder(target.path)) {
                            return this.downloadFile(
                                { uri: '/v1/screen/download/' + info.id, path: target.path + info.filename },
                                overallProgress,
                            );
                        }
                    }.bind(this),
                );
            }.bind(this),
        );
    }

    downloadFile(info, overallProgress) {
        // get token
        let token = readJSON('token');
        var uri = token.domain + info.uri;

        let options = {
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + token.access_token,
            },
        };

        if (!uri) {
            return Promise.reject('Missing URL');
        }

        var fiber;
        try {
            fiber = coscript.createFiber();
        } catch (err) {
            coscript.shouldKeepAround = true;
        }

        return new Promise(
            function (resolve, reject) {
                var url = NSURL.alloc().initWithString(uri);
                var request = NSMutableURLRequest.requestWithURL(url);
                request.setHTTPMethod('GET');

                Object.keys(options.headers || {}).forEach(function (i) {
                    request.setValue_forHTTPHeaderField(options.headers[i], i);
                });

                var finished = false;

                var task = NSURLSession.sharedSession().downloadTaskWithRequest_completionHandler(
                    request,
                    __mocha__.createBlock_function(
                        'v32@?0@"NSURL"8@"NSURLResponse"16@"NSError"24',
                        function (location, res, error) {
                            let fileManager = NSFileManager.defaultManager();
                            let targetUrl = NSURL.fileURLWithPath(info.path);

                            fileManager.replaceItemAtURL_withItemAtURL_backupItemName_options_resultingItemURL_error(
                                targetUrl,
                                location,
                                nil,
                                NSFileManagerItemReplacementUsingNewMetadataOnly,
                                nil,
                                nil,
                            );
                            task.progress().setCompletedUnitCount(100);

                            if (fiber) {
                                fiber.cleanup();
                            } else {
                                coscript.shouldKeepAround = false;
                            }

                            if (error) {
                                finished = true;
                                return reject(error);
                            }
                            return resolve(targetUrl.path());
                        },
                    ),
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
            }.bind(this),
        ).catch(
            function (e) {
                if (e.localizedDescription) {
                    console.error(e.localizedDescription);
                } else {
                    console.error(e);
                }

                throw e;
            }.bind(this),
        );
    }
}

export default new FileManager();
