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
                // Try to safely log the data
                if (typeof data === 'object') {
                    // Check each property individually
                    console.log('Data object properties:');
                    for (let key in data) {
                        if (data.hasOwnProperty(key)) {
                            try {
                                const value = data[key];
                                const valueType = typeof value;
                                console.log(`  ${key}: ${valueType} = ${value}`);

                                // If it's an object, try to get more details
                                if (valueType === 'object' && value !== null) {
                                    console.log(`    Object details: ${Object.prototype.toString.call(value)}`);
                                    if (value.constructor) {
                                        console.log(`    Constructor: ${value.constructor.name}`);
                                    }
                                }
                            } catch (propError) {
                                console.log(`  ${key}: Error accessing property - ${propError.message}`);
                            }
                        }
                    }
                } else {
                    console.log(`Data type: ${typeof data}, value: ${data}`);
                }
            } catch (e) {
                console.log('Could not analyze data: ' + e.message);
                console.log('Raw data:', data);
            }
        }
    }

    getExportPath() {
        // Ensure the path ends with a single slash
        const basePath = NSTemporaryDirectory().toString();
        const pluginPath = basePath + 'sketch-frontify/';

        // Create directory if it doesn't exist
        const fileManager = NSFileManager.defaultManager();
        if (!fileManager.fileExistsAtPath(pluginPath)) {
            try {
                fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(
                    pluginPath,
                    true,
                    nil,
                    nil,
                );
                this.logRequest('Created export directory: ' + pluginPath);
            } catch (e) {
                this.logRequest('Error creating export directory: ' + e.message);
            }
        }

        return pluginPath;
    }

    // Enhanced file path validation for Sketch beta
    validateAndCleanupExportPath(filePath) {
        const fileManager = NSFileManager.defaultManager();

        // Check if the path is actually a directory
        let isDirectory = false;
        const exists = fileManager.fileExistsAtPath_isDirectory(filePath, isDirectory);

        if (exists && isDirectory) {
            this.logRequest('WARNING: Export created directory instead of file: ' + filePath);

            // Try to find the actual file inside the directory
            const contents = fileManager.contentsOfDirectoryAtPath_error(filePath, nil);
            if (contents && contents.count() > 0) {
                // Look for the first valid file
                for (let i = 0; i < contents.count(); i++) {
                    const itemName = contents.objectAtIndex(i);
                    const itemPath = filePath + '/' + itemName;
                    let itemIsDirectory = false;

                    if (fileManager.fileExistsAtPath_isDirectory(itemPath, itemIsDirectory) && !itemIsDirectory) {
                        this.logRequest('Found file in directory: ' + itemPath);
                        return itemPath;
                    }
                }
            }
        }

        return filePath;
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

    // Helper method to clean up temporary directories after upload
    cleanupAfterUpload(originalPath, actualPath) {
        if (originalPath !== actualPath) {
            // If we extracted a file from a directory, clean up the directory
            const fileManager = NSFileManager.defaultManager();
            const parentDir = actualPath.substring(0, actualPath.lastIndexOf('/'));

            if (parentDir !== this.exportPath.replace(/\/$/, '')) {
                // Only remove if it's a subdirectory we created, not the main export path
                try {
                    fileManager.removeItemAtPath_error(parentDir, nil);
                    this.logRequest('Cleaned up temporary directory: ' + parentDir);
                } catch (e) {
                    this.logRequest('Could not clean up directory: ' + e.message);
                }
            }
        }
    }

    uploadFile(info, overallProgress) {
        this.logRequest('=== STARTING UPLOAD ===');
        this.logRequest('Raw upload info received:', info);

        // Enhanced validation of input parameters
        if (!info) {
            this.logRequest('ERROR: No upload info provided');
            return Promise.reject(new Error('No upload info provided'));
        }

        // Check each required property
        const requiredProps = ['path', 'filename', 'name', 'type'];
        for (let prop of requiredProps) {
            if (!info.hasOwnProperty(prop)) {
                this.logRequest(`ERROR: Missing required property: ${prop}`);
                return Promise.reject(new Error(`Missing required property: ${prop}`));
            }

            const value = info[prop];
            const valueType = typeof value;
            this.logRequest(`Property ${prop}: ${valueType} = "${value}"`);

            if (value === null || value === undefined) {
                this.logRequest(`ERROR: Property ${prop} is null or undefined`);
                return Promise.reject(new Error(`Property ${prop} is null or undefined`));
            }
        }

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

        // Enhanced file validation with directory detection
        let originalPath = info.path;
        if (info.path) {
            this.logRequest('Validating file at path: ' + info.path);

            let isDirectory = false;
            const pathExists = fileManager.fileExistsAtPath_isDirectory(info.path, isDirectory);

            if (!pathExists) {
                this.logRequest("ERROR: Path doesn't exist: " + info.path);
                return Promise.reject(new Error("Path doesn't exist: " + info.path));
            }

            if (isDirectory) {
                this.logRequest('WARNING: Path is a directory, searching for target file');

                // Try to find the actual file in the directory
                const contents = fileManager.contentsOfDirectoryAtPath_error(info.path, nil);
                let foundFile = null;

                if (contents) {
                    // Look for files with the expected extension
                    const expectedExt = info.filename.split('.').pop().toLowerCase();

                    for (let i = 0; i < contents.count(); i++) {
                        const itemName = contents.objectAtIndex(i);
                        const itemPath = info.path + '/' + itemName;
                        let itemIsDirectory = false;

                        if (fileManager.fileExistsAtPath_isDirectory(itemPath, itemIsDirectory) && !itemIsDirectory) {
                            if (itemName.toLowerCase().endsWith('.' + expectedExt)) {
                                foundFile = itemPath;
                                this.logRequest('Found target file in directory: ' + foundFile);
                                break;
                            }
                        }
                    }
                }

                if (foundFile) {
                    // Update the path to point to the actual file
                    info.path = foundFile;
                    this.logRequest('Updated path to actual file: ' + info.path);
                } else {
                    this.logRequest('ERROR: No suitable file found in directory');
                    return Promise.reject(new Error('Directory found but no suitable file inside: ' + info.path));
                }
            }

            // Validate the final file
            const fileAttributes = fileManager.attributesOfItemAtPath_error(info.path, nil);
            if (!fileAttributes) {
                this.logRequest('ERROR: Could not get file attributes');
                return Promise.reject(new Error('Could not get file attributes'));
            }

            const fileSize = Number(fileAttributes.fileSize());
            this.logRequest('File size: ' + fileSize + ' bytes');

            if (fileSize <= 0) {
                this.logRequest('ERROR: File is empty or inaccessible');
                return Promise.reject(new Error('File is empty or inaccessible: ' + info.path));
            }
        } else {
            this.logRequest('ERROR: No file path provided');
            return Promise.reject(new Error('No file path provided'));
        }

        // Process filename and create request data
        this.logRequest('Processing filename and request data');

        // remap slashes in filename to folders
        let filenameParts = info.filename.split('/');
        let filename = filenameParts.pop();
        this.logRequest('Processed filename: ' + filename);

        let name = info.name.split('/').pop();
        this.logRequest('Processed name: ' + name);

        // Create the data object with detailed logging
        let data = {
            name: name,
            filename: filename,
            origin: 'SKETCH',
            id_external: info.id_external,
        };

        this.logRequest('Base data object created:');
        this.logRequest('- name: ' + data.name + ' (type: ' + typeof data.name + ')');
        this.logRequest('- filename: ' + data.filename + ' (type: ' + typeof data.filename + ')');
        this.logRequest('- origin: ' + data.origin + ' (type: ' + typeof data.origin + ')');
        this.logRequest('- id_external: ' + data.id_external + ' (type: ' + typeof data.id_external + ')');

        // Add optional properties with validation
        if (info.pixel_ratio) {
            this.logRequest('Adding pixel_ratio: ' + info.pixel_ratio + ' (type: ' + typeof info.pixel_ratio + ')');
            data.pixel_ratio = info.pixel_ratio;
        }

        // Determine URI and add type-specific data
        let uri = '';
        this.logRequest('Processing upload type: ' + info.type);

        if (info.type === 'attachment') {
            this.logRequest('Processing as attachment');
            data['mimetype'] = 'image/png';
            data['asset_id'] = info.asset_id;
            uri += '/v1/attachment/create';

            this.logRequest('Attachment data:');
            this.logRequest('- mimetype: ' + data.mimetype + ' (type: ' + typeof data.mimetype + ')');
            this.logRequest('- asset_id: ' + data.asset_id + ' (type: ' + typeof data.asset_id + ')');
            this.logRequest('- URI: ' + uri);
        } else if (info.type === 'source') {
            this.logRequest('Processing as source');
            let path = filenameParts.join('/');
            data['mimetype'] = 'application/octet-stream';
            data['id'] = info.id;
            data['path'] = info.folder + path;
            data['project_id'] = info.project;

            uri += '/v1/assets';
            if (info.id) {
                uri += '/' + info.id;
            }

            this.logRequest('Source data:');
            this.logRequest('- mimetype: ' + data.mimetype + ' (type: ' + typeof data.mimetype + ')');
            this.logRequest('- id: ' + data.id + ' (type: ' + typeof data.id + ')');
            this.logRequest('- path: ' + data.path + ' (type: ' + typeof data.path + ')');
            this.logRequest('- project_id: ' + data.project_id + ' (type: ' + typeof data.project_id + ')');
            this.logRequest('- URI: ' + uri);
        } else {
            this.logRequest('Processing as default artboard');
            let path = filenameParts.join('/');
            data['mimetype'] = 'image/png';
            data['id'] = info.id;
            data['path'] = info.folder + path;
            data['project_id'] = info.project;

            uri += '/v1/assets';
            if (info.id) {
                uri += '/' + info.id;
            }

            this.logRequest('Artboard data:');
            this.logRequest('- mimetype: ' + data.mimetype + ' (type: ' + typeof data.mimetype + ')');
            this.logRequest('- id: ' + data.id + ' (type: ' + typeof data.id + ')');
            this.logRequest('- path: ' + data.path + ' (type: ' + typeof data.path + ')');
            this.logRequest('- project_id: ' + data.project_id + ' (type: ' + typeof data.project_id + ')');
            this.logRequest('- URI: ' + uri);
        }

        // Final data validation
        this.logRequest('=== FINAL DATA VALIDATION ===');
        for (let key in data) {
            if (data.hasOwnProperty(key)) {
                const value = data[key];
                const valueType = typeof value;
                this.logRequest(`Final data[${key}]: ${valueType} = "${value}"`);

                // Check for problematic values
                if (value === null) {
                    this.logRequest(`WARNING: data[${key}] is null`);
                } else if (value === undefined) {
                    this.logRequest(`WARNING: data[${key}] is undefined`);
                } else if (valueType === 'object') {
                    this.logRequest(`WARNING: data[${key}] is an object: ${Object.prototype.toString.call(value)}`);
                }
            }
        }

        var options = {
            method: 'POST',
            filepath: info.path,
            type: info.type,
            id: info.id,
            body: data,
        };

        this.logRequest('Created options object:', options);

        // get token
        let token = readJSON('token');
        this.logRequest('Token loaded:', token ? 'yes' : 'no');

        if (!token || !token.access_token) {
            this.logRequest('ERROR: No valid token found');
            return Promise.reject(new Error('No valid token found'));
        }

        let defaults = {
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + token.access_token,
            },
        };

        options = extend({}, defaults, options);
        this.logRequest('Extended options:', options);

        if (!uri) {
            this.logRequest('ERROR: Missing URL');
            return Promise.reject('Missing URL');
        }

        uri = token.domain + uri;
        this.logRequest('Final request URI: ' + uri);

        var fiber;
        try {
            fiber = coscript.createFiber();
        } catch (err) {
            coscript.shouldKeepAround = true;
        }

        return new Promise(
            function (resolve, reject) {
                this.logRequest('=== CREATING HTTP REQUEST ===');

                var url = NSURL.alloc().initWithString(uri);
                var request = NSMutableURLRequest.requestWithURL(url);
                request.setHTTPMethod('POST');

                Object.keys(options.headers || {}).forEach(
                    function (i) {
                        request.setValue_forHTTPHeaderField(options.headers[i], i);
                        this.logRequest(`Set header ${i}: ${options.headers[i]}`);
                    }.bind(this),
                );

                this.logRequest('=== CREATING FORM DATA ===');
                let formData = new FormData();

                // Form encoded params - FILE
                if (options.filepath) {
                    this.logRequest('Adding file to form data: ' + options.filepath);

                    try {
                        // Read file data
                        const fileData = NSData.alloc().initWithContentsOfFile(options.filepath);

                        if (!fileData) {
                            this.logRequest('ERROR: Failed to read file data');
                            return reject(new Error('Failed to read file data from: ' + options.filepath));
                        }

                        this.logRequest('Successfully read file data: ' + fileData.length() + ' bytes');

                        const fileInfo = {
                            fileName: options.body.filename,
                            mimeType: options.body.mimetype,
                            data: fileData,
                        };

                        this.logRequest('File info for form data:');
                        this.logRequest(
                            '- fileName: ' + fileInfo.fileName + ' (type: ' + typeof fileInfo.fileName + ')',
                        );
                        this.logRequest(
                            '- mimeType: ' + fileInfo.mimeType + ' (type: ' + typeof fileInfo.mimeType + ')',
                        );
                        this.logRequest('- data: NSData with ' + fileData.length() + ' bytes');

                        formData.append('file', fileInfo);
                        this.logRequest('File successfully appended to form data');
                    } catch (e) {
                        this.logRequest('ERROR reading file: ' + e.message);
                        return reject(new Error('Error reading file: ' + e.message));
                    }
                }

                // Form encoded params - OTHER PARAMETERS
                if (options.body) {
                    let params = options.body;
                    this.logRequest('Adding form parameters:');

                    for (let key in params) {
                        if (params.hasOwnProperty(key)) {
                            try {
                                const value = params[key];
                                const stringValue = '' + value; // Convert to string

                                this.logRequest(`Adding parameter ${key}:`);
                                this.logRequest(`  Original value: ${value} (type: ${typeof value})`);
                                this.logRequest(`  String value: ${stringValue} (type: ${typeof stringValue})`);

                                formData.append(key, stringValue);
                                this.logRequest(`  Successfully added ${key}`);
                            } catch (e) {
                                this.logRequest(`ERROR adding parameter ${key}: ${e.message}`);
                                return reject(new Error(`Error adding parameter ${key}: ${e.message}`));
                            }
                        }
                    }
                }

                this.logRequest('=== PREPARING HTTP BODY ===');
                var data = formData._data;
                var boundary = formData._boundary;

                this.logRequest('Form boundary: ' + boundary);
                this.logRequest('Form data size before boundary: ' + data.length() + ' bytes');

                request.setValue_forHTTPHeaderField('multipart/form-data; boundary=' + boundary, 'Content-Type');

                // Add boundary terminator
                data.appendData(
                    NSString.alloc()
                        .initWithString('--' + boundary + '--\r\n')
                        .dataUsingEncoding(NSUTF8StringEncoding),
                );

                this.logRequest('Final form data size: ' + data.length() + ' bytes');

                var finished = false;

                this.logRequest('=== STARTING UPLOAD TASK ===');

                var task = NSURLSession.sharedSession().uploadTaskWithRequest_fromData_completionHandler(
                    request,
                    data,
                    __mocha__.createBlock_function(
                        'v32@?0@"NSData"8@"NSURLResponse"16@"NSError"24',
                        function (responseData, res, error) {
                            this.logRequest('=== UPLOAD TASK COMPLETED ===');

                            task.progress().setCompletedUnitCount(100);

                            if (fiber) {
                                fiber.cleanup();
                            } else {
                                coscript.shouldKeepAround = false;
                            }

                            if (error) {
                                this.logRequest('Upload task error:', error);
                                this.logRequest('Error details:');
                                this.logRequest('- localizedDescription: ' + error.localizedDescription());
                                this.logRequest('- code: ' + error.code());
                                this.logRequest('- domain: ' + error.domain());
                                finished = true;
                                return reject(error);
                            }

                            this.logRequest('Upload task successful, processing response');

                            // Clean up temporary directories if needed
                            this.cleanupAfterUpload(originalPath, info.path);

                            return resolve(response(res, responseData));
                        }.bind(this),
                    ),
                );

                task.resume();
                this.logRequest('Upload task started');

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
                    this.logRequest('=== PROCESSING RESPONSE ===');
                    this.logRequest('Response received, converting to JSON');
                    return response.json();
                }.bind(this),
            )
            .then(
                function (jsonData) {
                    this.logRequest('=== FINAL RESPONSE ===');
                    this.logRequest('JSON response:', jsonData);
                    return jsonData;
                }.bind(this),
            )
            .catch(
                function (e) {
                    this.logRequest('=== UPLOAD ERROR ===');
                    this.logRequest('Error message: ' + e.message);

                    if (e.localizedDescription) {
                        this.logRequest('Localized description: ' + e.localizedDescription);
                    }

                    // Enhanced error inspection
                    this.logRequest('Error object analysis:');
                    try {
                        this.logRequest('Error type: ' + typeof e);
                        this.logRequest('Error constructor: ' + (e.constructor ? e.constructor.name : 'unknown'));
                        this.logRequest('Error string: ' + String(e));

                        for (let prop in e) {
                            if (e.hasOwnProperty(prop)) {
                                try {
                                    this.logRequest(`Error property [${prop}]: ${typeof e[prop]} = ${e[prop]}`);
                                } catch (propErr) {
                                    this.logRequest(`Error accessing property [${prop}]: ${propErr.message}`);
                                }
                            }
                        }

                        if (e.response) {
                            this.logRequest('Response error:', e.response);
                        }

                        if (e.stack) {
                            this.logRequest('Error stack: ' + e.stack);
                        }
                    } catch (inspectErr) {
                        this.logRequest('Error while inspecting error: ' + inspectErr.message);
                    }

                    // Clean up temporary directories even on error
                    this.cleanupAfterUpload(originalPath, info.path);

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
