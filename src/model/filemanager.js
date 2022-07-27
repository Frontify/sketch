import readJSON from '../helpers/readJSON';
import writeJSON from '../helpers/writeJSON';
import createFolder from '../helpers/createFolder';
import target from './target';
import source from './source';
import sketch from './sketch';
import user from './user';
import FormData from 'sketch-polyfill-fetch/lib/form-data';

import extend from '../helpers/extend';
import response from '../helpers/response';

import { Error } from './error';

let sketch3 = require('sketch');

import shaFile from '../helpers/shaFile';

/**
 * Merge two objects. A bit smarter than Objects.assign(). Can deal with nested keys, too.
 */
function merge(a, b) {
    return Object.entries(b).reduce((o, [k, v]) => {
        o[k] = v && typeof v === 'object' ? merge((o[k] = o[k] || (Array.isArray(v) ? [] : {})), v) : v;
        return o;
    }, a);
}

class FileManager {
    constructor() {
        this.exportPath = NSTemporaryDirectory() + 'sketch-frontify/';
    }

    getExportPath() {
        return this.exportPath;
    }

    isCurrentSaved() {
        if (!sketch.getDocument()) return false;
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
                                null
                            );
                        }

                        return true;
                    } else {
                        return false;
                    }
                }

                return false;
            }.bind(this)
        );
    }

    moveCurrent(brand, project, folder) {
        let base = target.getPathToSyncFolderForBrandAndProject(brand, project);
        let path = `${base}/${folder}/`;

        if (createFolder(path)) {
            let doc = sketch.getDocument();
            let selectedDocument = sketch3.Document.getSelectedDocument();
            let sha = '' + shaFile(selectedDocument.path);

            if (doc) {
                let nsurl = doc.fileURL();
                let nsPath = nsurl.path();
                let parts = nsPath.split('/');
                let currentFilename = parts.pop();
                let newNsurl = NSURL.fileURLWithPath(path + currentFilename);

                // full path
                let filePath = path + currentFilename;

                let relativePath = source.getRelativePath(filePath);

                // move to the target folder
                doc.moveToURL_completionHandler_(newNsurl, null);

                this.updateAssetDatabase({
                    uuid: selectedDocument.id,
                    path: filePath,
                    relativePath: relativePath,
                    sha: sha,
                    previous: {
                        sha: sha,
                    },
                });
            }

            return true;
        }

        return false;
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

    async fetchRemoteState(entry) {
        // Edge case: Missing API data.
        // This really should never happen if the plugin is used to manage files.

        if (entry.refs && entry.refs.remote_id) {
            let remoteData = await source.getAssetForLegacyAssetID(entry.refs.remote_id);
            return remoteData;
        }

        // TODO: Save state to database
    }

    computeSyncState(entry) {
        // Don’t mutate the state field if the file is not found
        // File must be relinked first
        if (entry.state == 'file-not-found') return;
        if (entry.refs && !entry.remote) return 'asset-not-found';

        let needsPush = false;
        let needsPull = false;

        if (entry.previous && entry.remote) {
            // Remote hasn’t changed
            let remoteChanges = entry.previous?.modifiedAt != entry.remote.modifiedAt;

            if (!remoteChanges) {
                if (entry.dirty || entry.previous.sha != entry.sha) {
                    return 'push';
                } else {
                    return 'same';
                }
            }
            if (remoteChanges) {
                // Remote has changed
                // Do we have local changes?

                if (entry.dirty) {
                    needsPush = true;
                }
                if (entry.remote?.modifiedAt > entry.previous?.modifiedAt) {
                    needsPull = true;
                }
                if (needsPull && needsPush) {
                    return 'conflict';
                }
                return 'pull';
            }
        }

        return entry.state || 'untracked';
    }

    validateAssetDatabase() {
        let database = this.getAssetDatabaseFile();
        Object.keys(database).forEach((uuid) => {
            let entry = database[uuid];

            if (typeof entry.path == 'string') {
                try {
                    if (!NSFileManager.defaultManager().fileExistsAtPath(entry.path)) {
                        database[uuid].state = 'file-not-found';
                    }
                } catch (error) {
                    console.error(error);
                }
            }
        });
        this.writeAssetDatabaseFile(database);
        return database;
    }

    writeAssetDatabaseFile(database) {
        let id = target.getValueForKey('brand');
        writeJSON(`brand-${id}`, database);
    }

    getAssetDatabaseFile() {
        let id = target.getValueForKey('brand');
        return readJSON(`brand-${id}`) || {};
    }
    getAssetDatabase() {
        return this.validateAssetDatabase();
    }

    refreshAssetDatabase() {
        // asset.searchSketchAssetsInProject()
        // Get API data for all entries
    }

    async updateAssetDatabase(payload) {
        if (!payload.uuid) return;

        let database = this.getAssetDatabaseFile();
        let entry = database[payload.uuid] || {};

        // Merge
        let merged = [{}, entry, payload].reduce(merge);

        // Timestamp
        merged.timestamp = '' + new Date().toISOString();

        merged.state = this.computeSyncState(merged);

        database[payload.uuid] = merged;

        this.writeAssetDatabaseFile(database);

        return merged;
    }

    async refreshAsset(uuid) {
        let database = this.getAssetDatabaseFile();
        let entry = database[uuid] || {};

        // Update remote
        let remote = await this.fetchRemoteState(entry);

        // asset no longer exists
        if (!remote) {
            console.log('remote no longer exists');
            // entry.refs = {};
        }
        entry.remote = remote;

        // Update state
        entry.state = this.computeSyncState(entry);

        // Write updates to disk
        database[uuid] = entry;

        this.writeAssetDatabaseFile(database);
        return entry;
    }

    openFile(path) {
        // return NSWorkspace.sharedWorkspace().openFile(path);
        return NSWorkspace.sharedWorkspace().openFile(path);
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
        console.log('filemanager.uploadfile', info);
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
        } else if (info.type === 'source') {
            let path = filenameParts.join('/');
            data['mimetype'] = 'application/octet-stream';
            data['id'] = info.id;
            data['path'] = info.folder + path;
            data['project_id'] = info.project;

            uri += '/v1/assets/';
            if (info.id) {
                uri += info.id;
            }
        } else {
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
            body: data,
        };

        // get token

        let { domain, token } = user.getAuthentication();

        let defaults = {
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + token,
            },
        };

        options = extend({}, defaults, options);

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

    // uri: /v1/...
    downloadFile(uri, path, overallProgress) {
        console.log('download: ', uri, path);
        let folder = path.split('/').slice(0, -1).join('/');

        if (!createFolder(folder)) {
            throw new Error('Could not create folder');
        }

        // get token

        let { token, domain } = user.getAuthentication();

        uri = domain + uri;

        let options = {
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + token,
            },
        };

        console.log('full uri', uri, options);

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
                console.log('inside promise');
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
                            let targetUrl = NSURL.fileURLWithPath(path);

                            fileManager.replaceItemAtURL_withItemAtURL_backupItemName_options_resultingItemURL_error(
                                targetUrl,
                                location,
                                nil,
                                NSFileManagerItemReplacementUsingNewMetadataOnly,
                                nil,
                                nil
                            );
                            task.progress().setCompletedUnitCount(100);

                            if (fiber) {
                                fiber.cleanup();
                            } else {
                                coscript.shouldKeepAround = false;
                            }

                            if (res.statusCode() == 404) {
                                return reject('Server responded with status code 404');
                            }
                            if (error) {
                                finished = true;
                                console.error(error);
                                return reject(error);
                            }

                            console.log('resolve targeturl.path', res, res.statusCode());

                            return resolve(targetUrl.path());
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
            }.bind(this)
        ).catch(
            function (e) {
                if (e.localizedDescription) {
                    console.error(e.localizedDescription);
                } else {
                    console.error(e);
                }

                throw e;
            }.bind(this)
        );
    }

    downloadFileToPath(uri, path, overallProgress) {
        /**
         * No access token is required to download a file.
         */
        let options = {
            method: 'GET',
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
                            let targetUrl = NSURL.fileURLWithPath(path);

                            fileManager.replaceItemAtURL_withItemAtURL_backupItemName_options_resultingItemURL_error(
                                targetUrl,
                                location,
                                nil,
                                NSFileManagerItemReplacementUsingNewMetadataOnly,
                                nil,
                                nil
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
            }.bind(this)
        ).catch(
            function (e) {
                if (e.localizedDescription) {
                    console.error(e.localizedDescription);
                } else {
                    console.error(e);
                }

                throw e;
            }.bind(this)
        );
    }
}

export default new FileManager();
