import fetch from '../helpers/fetch'
import shaFile from '../helpers/shaFile'
import sketch from './sketch'
import target from './target';
import filemanager from './filemanager';

class Artboard {
    constructor() {
        this.pixelRatio = 2;
    }

    getArtboards() {
        return target.getTarget().then(function (target) {
            // load remote assets status
            return fetch('/v1/assets/status/' + target.project.id + '?path=' + encodeURIComponent(target.set.path)).then(function (result) {
                var assets = result.assets;

                // get artboards
                var artboards = [];
                var doc = NSDocumentController.sharedDocumentController().currentDocument();

                if (doc) {
                    var mspage = doc.currentPage();
                    var msartboards = mspage.artboards();

                    for (var i = 0; i < msartboards.length; i++) {
                        var msartboard = msartboards[i];

                        artboards.push({
                            id: null,
                            id_external: '' + msartboard.objectID(),
                            name: '' + msartboard.name(),
                            sha: null,
                            state: 'new',
                            target: '',
                            modified: null,
                            modifier_name: null,
                            modified_localized_ago: null
                        });
                    }

                    // compare with remote status
                    for (var i = 0; i < artboards.length; i++) {
                        var artboard = artboards[i];

                        for (var id in assets) {
                            if (assets.hasOwnProperty(id)) {
                                var asset = assets[id];
                                var path = asset.path.replace(new RegExp('^' + target.set.path), '');

                                if (path + asset.filename == artboard.name + '.' + asset.ext) {
                                    artboard.id = asset.id;
                                    artboard.sha = asset.sha;
                                    artboard.state = 'uploaded';
                                    artboard.modified = asset.modified;
                                    artboard.modifier_name = asset.modifier_name;
                                    artboard.modified_localized_ago = asset.modified_localized_ago;
                                }
                            }
                        }
                    }
                }

                var data = {
                    artboards: artboards.reverse(),
                    target: target
                };

                return data;
            }.bind(this));
        }.bind(this));
    }

    exportArtboard(artboard) {
        return new Promise(function (resolve, reject) {
            var doc = NSDocumentController.sharedDocumentController().currentDocument();
            if (!doc) {
                reject();
            }

            var path = filemanager.getExportPath() + artboard.name + '.png';
            var format = MSExportFormat.alloc().init();
            format.setFileFormat('png');
            format.setScale(this.pixelRatio); // @2x

            var predicate = NSPredicate.predicateWithFormat('objectID == %@', artboard.id_external);
            var msartboard = sketch.findFirstLayer(predicate, nil, MSArtboardGroup);
            var exportRequest = MSExportRequest.exportRequestsFromExportableLayer_exportFormats_useIDForName(msartboard, [format], true).firstObject();
            doc.saveArtboardOrSlice_toFile(exportRequest, path);

            resolve({
                name: artboard.name,
                ext: 'png',
                id_external: artboard.id_external,
                id: artboard.id,
                sha: artboard.sha,
                path: path
            })
        }.bind(this));
    }

    uploadArtboards(ui, artboards) {
        // sequence artboard export and upload
        return target.getTarget().then(function(target) {
            return artboards.reduce(function (sequence, artboard) {
                return sequence.then(function () {
                    return this.exportArtboard(artboard);
                }.bind(this)).then(function (result) {
                    if (artboard.sha != shaFile(result.path)) {
                        return filemanager.uploadFile({
                            path: result.path,
                            name: result.name + '.' + result.ext,
                            id: result.id,
                            id_external: result.id_external,
                            pixel_ratio: this.pixelRatio,
                            folder: target.set.path,
                            project: target.project.id
                        }).then(function (data) {
                            filemanager.deleteFile(result.path);
                            artboard.id = data.id;
                            artboard.nochanges = false;
                            ui.eval('artboardUploaded(' + JSON.stringify(artboard) + ')');
                            return true;
                        }).catch(function (err) {
                            ui.eval('artboardUploadFailed(' + JSON.stringify(artboard) + ')');
                            return true;
                        });
                    }
                    else {
                        filemanager.deleteFile(result.path);
                        artboard.nochanges = true;
                        ui.eval('artboardUploaded(' + JSON.stringify(artboard) + ')');
                        return true;
                    }
                }.bind(this));
            }.bind(this), Promise.resolve());
        }.bind(this));
    }

    showArtboards(ui) {
        this.getArtboards().then(function (data) {
            ui.eval('showArtboards(' + JSON.stringify(data) + ')');
        }.bind(this));
    }
}

export default new Artboard();

