import readJSON from '../helpers/readJSON'
import readFile from '../helpers/readFile'
import writeJSON from '../helpers/writeJSON'
import writeFile from '../helpers/writeFile'
import fetch from '../helpers/fetch'
import createFolder from '../helpers/createFolder'
import target from './target'

class FileManager {
    constructor() {
        this.context = null;
        this.exportPath = NSTemporaryDirectory() + 'sketch-frontify/';
        this.clearExportFolder();
    }

    setContext(context) {
        this.context = context;
    }

    getExportPath() {
        return this.exportPath;
    }

    isCurrentSaved() {
        return !!NSDocumentController.sharedDocumentController().currentDocument().fileURL();

    }

    saveCurrent() {
        return target.getTarget('sources').then(function (data) {
            // create folder first
            if (createFolder(data.path)) {
                var dialog = NSSavePanel.savePanel();
                dialog.canCreateDirectories = false;
                dialog.directoryURL = NSURL.fileURLWithPath(data.path);
                dialog.allowedFileTypes = ['sketch'];
                dialog.message = 'Save your Sketch File in the Frontify sync folder';

                var clicked = dialog.runModal();

                if (clicked == NSOKButton) {
                    var url = dialog.URL();
                    NSDocumentController.sharedDocumentController().currentDocument().saveToURL_ofType_forSaveOperation_error_(url, "com.bohemiancoding.sketch.drawing", NSSaveOperation, null);

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
        return target.getTarget('sources').then(function (data) {
            if (createFolder(data.path)) {
                var nsurl = NSDocumentController.sharedDocumentController().currentDocument().fileURL();
                var path = nsurl.path();
                var parts = path.split('/');
                var currentFilename = parts.pop();
                var newNsurl =  NSURL.fileURLWithPath(data.path + currentFilename);

                // move to the target folder
                NSDocumentController.sharedDocumentController().currentDocument().moveToURL_completionHandler_(newNsurl, null);

                return true;
            }

            return false;
        }.bind(this));
    }

    uploadFile(info) {
        return target.getSimpleTarget().then(function (target) {
            var content = readFile(info.path, 'base64');

            var data = {
                project_id: target.project,
                encoding: 'base64',
                content: '' + content,
                mimetype: 'image/png',
                id: info.id,
                filename: info.name,
                folder_id: info.folder_id,
                origin: 'SKETCH'
            };

            if(info.pixelRatio) {
                data.pixelRatio = info.pixelRatio;
            }

            var url = '/v1/assets/';
            if (info.id) {
                url += info.id;
            }

            return fetch(url, {method: 'POST', body: JSON.stringify(data)});
        }.bind(this));
    }

    downloadFile(info) {
        var promises = [
            fetch('/v1/screen/download/' + info.id),
            fetch('/v1/screen/modified/' + info.id)
        ];

        return Promise.all(promises).then(function (result) {
            var file = result[0];
            var meta = result[1];

            this.updateAssetStatus(meta.screen.project, meta.screen);

            // save file
            return target.getTarget('sources').then(function (target) {
                return writeFile(target.path + info.filename, file);
            }.bind(this));
        }.bind(this));
    }

    updateAssetStatus(project, asset) {
        var status = readJSON('project-' + project) || {};
        status.assets = status.assets || {};
        status.assets[asset.id] = status[asset.id] || {};
        status.assets[asset.id].id = asset.id;
        status.assets[asset.id].modified = asset.modified;
        status.assets[asset.id].sha = asset.sha;
        writeJSON('project-' + project, status);
    }

    openFile(path) {
        NSWorkspace.sharedWorkspace().openFile(path);
    }

    deleteFile(path) {
        var fileManager = NSFileManager.defaultManager();
        fileManager.removeItemAtPath_error(path, nil);
    }

    clearExportFolder() {
        var fileManager = NSFileManager.defaultManager();
        fileManager.removeItemAtPath_error(this.exportPath, nil);
    }
}

export default new FileManager();

