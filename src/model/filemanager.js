import readJSON from '../helpers/readJSON'
import writeJSON from '../helpers/writeJSON'
import fetch from '../helpers/fetch'
import createFolder from '../helpers/createFolder'
import target from './target'
import sketch from './sketch'
import FormData from 'sketch-polyfill-fetch/lib/form-data';
import { isWebviewPresent, sendToWebview } from 'sketch-module-web-view/remote'
import extend from "../helpers/extend";
import response from  "../helpers/response";

class FileManager {
    constructor() {
        this.exportPath = NSTemporaryDirectory() + 'sketch-frontify/';
        this.clearExportFolder();
    }

    getExportPath() {
        return this.exportPath;
    }

    isCurrentSaved() {
        return !!sketch.getDocument().fileURL();
    }

    saveCurrent() {
        return target.getTarget('sources').then(function(data) {
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
                        doc.saveToURL_ofType_forSaveOperation_error_(url, "com.bohemiancoding.sketch.drawing", NSSaveOperation, null);
                    }

                    return true;
                }
                else {
                    return false;
                }
            }

            return false;
        }.bind(this));

    }

    moveCurrent() {
        return target.getTarget('sources').then(function(data) {
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
        }.bind(this));
    }

    updateAssetStatus(project, asset) {
        let status = readJSON('sources-' + project) || {};
        status.assets = status.assets || {};
        status.assets[asset.id] = status[asset.id] || {};
        status.assets[asset.id].id = asset.id;
        status.assets[asset.id].modified = asset.modified;
        status.assets[asset.id].sha = asset.sha;
        writeJSON('sources-' + project, status);
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
        // remap slashes in filename to folders
        let filenameParts = info.filename.split('/');
        let filename = filenameParts.pop();

        let name = info.name.split('/').pop();

        let data = {
            name: name,
            filename: filename,
            origin: 'SKETCH',
            id_external: info.id_external
        };

        if (info.pixel_ratio) {
            data.pixel_ratio = info.pixel_ratio;
        }

        let uri = '';

        if (info.type === 'attachment') {
            data['mimetype'] = 'image/png';
            data['asset_id'] = info.asset_id;
            uri += '/v1/attachment/create'
        }
        else if(info.type === 'source') {
            let path = filenameParts.join('/');
            data['mimetype'] = 'application/octet-stream';
            data['id'] = info.id;
            data['path'] = info.folder + path;
            data['project_id'] = info.project;

            uri += '/v1/assets/';
            if (info.id) {
                uri += info.id;
            }
        }
        else {
            let path = filenameParts.join('/');
            data['mimetype'] = 'image/png';
            data['id'] = info.id;
            data['path'] = info.folder + path;
            data['project_id'] = info.project;

            uri += '/v1/assets/';
            if (info.id) {
                uri += info.id;
            }
        }

        var options = {
            method: 'POST',
            filepath: info.path,
            type: info.type,
            id: info.id,
            body: data
        };

        // get token
        let token = readJSON('token');
        let defaults = {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token.access_token,
            }
        };

        options = extend({}, defaults, options);

        if (!uri) {
            return Promise.reject("Missing URL");
        }

        uri = token.domain + uri;

        var fiber;
        try {
            fiber = coscript.createFiber();
        } catch (err) {
            coscript.shouldKeepAround = true;
        }

        return new Promise(function(resolve, reject) {
            var url = NSURL.alloc().initWithString(uri);
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
                        task.progress().setCompletedUnitCount(100);

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

            if(overallProgress && task) {
                overallProgress.addChild_withPendingUnitCount(task.progress(), 10);
            }

            if (fiber) {
                fiber.onCleanup(function() {
                    if (!finished) {
                        task.cancel();
                    }
                });
            }
        }).then(function(response) {
            return response.json();
        }.bind(this)).catch(function(e) {
            if (e.localizedDescription) {
                console.error(e.localizedDescription);
            }
            else {
                console.error(e);
            }

            throw e;
        }.bind(this));
    }

    downloadFile(info, overallProgress) {
        return fetch('/v1/screen/modified/' + info.id).then(function(meta) {
            this.updateAssetStatus(meta.screen.project, meta.screen);

            return target.getTarget('sources').then(function(target) {
                if (createFolder(target.path)) {

                    // get token
                    let token = readJSON('token');
                    let options = {
                        method: 'GET',
                        headers: {
                            'Authorization': 'Bearer ' + token.access_token,
                        }
                    };

                    var uri = token.domain + '/v1/screen/download/' + info.id;

                    if (!uri) {
                        return Promise.reject("Missing URL");
                    }

                    var fiber;
                    try {
                        fiber = coscript.createFiber();
                    } catch (err) {
                        coscript.shouldKeepAround = true;
                    }

                    return new Promise(function(resolve, reject) {
                        var url = NSURL.alloc().initWithString(uri);
                        var request = NSMutableURLRequest.requestWithURL(url);
                        request.setHTTPMethod("GET");

                        Object.keys(options.headers || {}).forEach(function(i) {
                            request.setValue_forHTTPHeaderField(options.headers[i], i);
                        });

                        var finished = false;

                        var task = NSURLSession.sharedSession().downloadTaskWithRequest_completionHandler(
                            request,
                            __mocha__.createBlock_function(
                                'v32@?0@"NSURL"8@"NSURLResponse"16@"NSError"24',
                                function(location, res, error) {
                                    let fileManager = NSFileManager.defaultManager();
                                    let targetUrl = NSURL.fileURLWithPath(target.path + info.filename);

                                    fileManager.replaceItemAtURL_withItemAtURL_backupItemName_options_resultingItemURL_error(targetUrl, location, nil, NSFileManagerItemReplacementUsingNewMetadataOnly, nil, nil);
                                    task.progress().setCompletedUnitCount(100);

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
                                    return resolve(targetUrl.path());
                                }
                            )
                        );

                        task.resume();

                        if(overallProgress && task) {
                            overallProgress.addChild_withPendingUnitCount(task.progress(), 10);
                        }

                        if (fiber) {
                            fiber.onCleanup(function() {
                                if (!finished) {
                                    task.cancel();
                                }
                            });
                        }
                    }.bind(this)).catch(function(e) {
                        if (e.localizedDescription) {
                            console.error(e.localizedDescription);
                        }
                        else {
                            console.error(e);
                        }

                        throw e;
                    }.bind(this));
                }
            }.bind(this));
        }.bind(this));
    }
}

export default new FileManager();

