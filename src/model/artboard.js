import fetch from '../helpers/fetch'
import shaFile from '../helpers/shaFile'
import sketch from './sketch'
import target from './target';
import filemanager from './filemanager';
import { isWebviewPresent, sendToWebview } from 'sketch-module-web-view/remote'

var dom = require('sketch/dom');

class Artboard {
    constructor() {
        this.pixelRatio = 2;
        this.remoteAssets = null;
        this.uploadInProgress = false;
    }

    getArtboards(skipRemote) {
        return target.getTarget().then(function (target) {
            var remoteStatus = null;
            if(skipRemote && this.remoteAssets) {
                remoteStatus = Promise.resolve({ assets: this.remoteAssets });
            }
            else {
                // load remote assets status
                remoteStatus = fetch('/v1/assets/status/' + target.project.id + '?include_count_annotation=true&path=' + encodeURIComponent(target.set.path));
            }

            return remoteStatus.then(function (result) {
                var assets = result.assets;
                this.remoteAssets = result.assets;

                // get artboards
                var artboards = [];
                var doc = sketch.getDocument();

                if (doc) {
                    var mspage = doc.currentPage();
                    var msartboards = mspage.artboards();

                    for (var i = 0; i < msartboards.length; i++) {
                        var msartboard = msartboards[i];

                        artboards.push({
                            id: null,
                            id_external: '' + msartboard.objectID(),
                            name: '' + msartboard.name(),
                            ext: 'png',
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
                                var path = asset.path;
                                if(asset.path.indexOf(target.set.path) === 0) {
                                    path =  asset.path.replace(target.set.path, '');
                                }

                                if (path + asset.filename == artboard.name + '.' + asset.ext) {
                                    artboard.id = asset.id;
                                    artboard.sha = asset.sha;
                                    artboard.ext = asset.ext;
                                    artboard.state = 'uploaded';
                                    artboard.count_annotation_open = asset.count_annotation_open;
                                    artboard.modified = asset.modified;
                                    artboard.modifier_name = asset.modifier_name;
                                    artboard.modified_localized_ago = asset.modified_localized_ago;
                                }
                            }
                        }
                    }

                    // compare with selected artboards
                    var selectedArtboards = [];
                    var jsdoc = dom.Document.fromNative(sketch.getDocument());
                    jsdoc.selectedLayers.forEach(function(layer) {
                        if(layer.type === 'Artboard') {
                            selectedArtboards.push(layer.id);
                        }
                    }.bind(this));

                    for (var i = 0; i < artboards.length; i++) {
                        var artboard = artboards[i];
                        if(selectedArtboards.indexOf(artboard.id_external) > -1) {
                            artboard.selected = true;
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

    exportArtboard(artboard, doc) {
        return new Promise(function (resolve, reject) {
            var files = [];
            var predicate = NSPredicate.predicateWithFormat('objectID == %@', artboard.id_external);
            var msartboard = sketch.findFirstLayer(predicate, nil, MSArtboardGroup);
            var jsartboard = dom.Artboard.fromNative(msartboard);

            // Export artboard image -> traditional MSExportRequest for better naming control
            var imageFormat = MSExportFormat.alloc().init();
            imageFormat.setFileFormat('png');
            imageFormat.setScale(this.pixelRatio); // @2x

            var path = filemanager.getExportPath() + artboard.name + '.png';


            var exportRequest = MSExportRequest.exportRequestsFromExportableLayer_exportFormats_useIDForName(msartboard, [imageFormat], true).firstObject();

            doc.saveArtboardOrSlice_toFile(exportRequest, path);

            files.push({
                name: artboard.name,
                ext: 'png',
                id_external: artboard.id_external,
                id: artboard.id,
                sha: artboard.sha,
                path: path
            });

            // Export artboard structure -> via JS API as its not possible to export JSON with MSExportRequest
            dom.export(jsartboard, {
                formats: 'json',
                output: filemanager.getExportPath(),
                overwriting: true
            });

            files.push({
                name: artboard.name,
                ext: 'json',
                id_external: artboard.id_external,
                id: artboard.id,
                path: filemanager.getExportPath() + artboard.name + '.json'
            });

            // Export formats -> traditional MSExportRequest for better naming control
            function exportFormats(layer) {
                layer.exportFormats.forEach(function(format) {

                    var name = '';
                    if(format.prefix && format.prefix !== 'null') {
                        name += format.prefix;
                    }

                    name += layer.name;

                    if(format.suffix && format.suffix !== 'null') {
                        name += format.suffix;
                    }

                    var path = filemanager.getExportPath() + name + '.' + format.fileFormat;

                    var layerFormat = MSExportFormat.alloc().init();
                    layerFormat.setFileFormat(format.fileFormat);
                    layerFormat.setScale(format.size);

                    var exportRequest = MSExportRequest.exportRequestsFromExportableLayer_exportFormats_useIDForName(layer.sketchObject, [layerFormat], true).firstObject();
                    doc.saveArtboardOrSlice_toFile(exportRequest, path);

                    files.push({
                        name: name,
                        ext: format.fileFormat,
                        id_external: layer.id,
                        id: layer.id,
                        path: path
                    });
                });

                if (layer.layers) {
                    layer.layers.forEach(exportFormats)
                }
            }

            exportFormats(jsartboard);

            resolve(files);
        }.bind(this));
    }

    uploadArtboards(artboards) {
        // sequence artboard export and upload
        this.uploadInProgress = true;

        return target.getTarget().then(function(target) {
            var doc = sketch.getDocument();
            if (!doc) {
                return Promise.reject('No document found');
            }
            else {
                return artboards.reduce(function (sequence, artboard) {
                    return sequence.then(function () {
                        return this.exportArtboard(artboard, doc);
                    }.bind(this)).then(function (files) {
                        return files.reduce(function(uploadsequence, file) {
                            return uploadsequence.then(function() {
                                var status = this.getRemoteStatusForFile(artboard, file);
                                if (status.sha != shaFile(file.path)) {
                                    return filemanager.uploadFile({
                                        path: file.path,
                                        name: file.name + '.' + file.ext,
                                        id: file.id,
                                        id_external: file.id_external,
                                        pixel_ratio: this.pixelRatio,
                                        folder: target.set.path,
                                        project: target.project.id,
                                        type: 'artboard'
                                    }).then(function(data) {
                                        filemanager.deleteFile(file.path);
                                        artboard.sha = data.sha;
                                        artboard.id = data.id;
                                        artboard.nochanges = false;
                                        return true
                                    }.bind(this));
                                }
                                else {
                                    filemanager.deleteFile(file.path);
                                    artboard.nochanges = true;
                                    return true;
                                }
                            }.bind(this));
                        }.bind(this), Promise.resolve()).then(function() {
                            if (isWebviewPresent('frontifymain')) {
                                sendToWebview('frontifymain', 'artboardUploaded(' + JSON.stringify(artboard) + ')');
                            }
                            return true;
                        }).catch(function (err) {
                            if (isWebviewPresent('frontifymain')) {
                                sendToWebview('frontifymain', 'artboardUploadFailed(' + JSON.stringify(artboard) + ')');
                            }
                            return true;
                        }.bind(this));
                    }.bind(this));
                }.bind(this), Promise.resolve());
            }
        }.bind(this)).then(function(data) {
            this.uploadInProgress = false;
        }.bind(this)).catch(function(e) {
            this.uploadInProgress = false;
            console.error(e);
        }.bind(this));
    }

    getRemoteStatusForFile(artboard, file) {
        var status = null;

        if (file.id_external == artboard.id_external && file.ext == artboard.ext) {
            status = artboard;
        }
        else if(artboard.attachments && artboard.attachments.length > 0) {
            artboard.attachments.forEach(function(attachment) {
                if (file.id_external == attachment.id_external && file.name == artboard.name && file.ext == artboard.ext) {
                    status = attachment
                }
            }.bind(this));
        }

        if(!status) {
            status = artboard;
        }

        return status;
    }

    showArtboards(skipRemote) {
        if(!this.uploadInProgress) {
            this.getArtboards(skipRemote).then(function(data) {
                if (isWebviewPresent('frontifymain')) {
                    sendToWebview('frontifymain', 'showArtboards(' + JSON.stringify(data) + ')');
                }
            }.bind(this)).catch(function(e) {
                console.error(e);
            }.bind(this));
        }
        else {
            console.log('upload in progress');
        }
    }
}

export default new Artboard();

