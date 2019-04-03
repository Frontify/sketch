import fetch from '../helpers/fetch'
import shaFile from '../helpers/shaFile'
import sketch from './sketch'
import target from './target';
import filemanager from './filemanager';
import {isWebviewPresent, sendToWebview} from 'sketch-module-web-view/remote'

let API = require('sketch');
let DOM = require('sketch/dom');
let Settings = require('sketch/settings');

class Artboard {
    constructor() {
        this.pixelRatio = 2;
        this.remoteAssets = null;
        this.uploadInProgress = false;
    }

    getArtboards(skipRemote) {
        return target.getTarget().then(function(target) {
            let remoteStatus = null;
            if (skipRemote && this.remoteAssets) {
                remoteStatus = Promise.resolve({assets: this.remoteAssets});
            }
            else {
                // load remote assets status
                remoteStatus = fetch('/v1/assets/status/' + target.project.id + '?include_count_annotation=true&include_attachments=true&path=' + encodeURIComponent(target.set.path));
            }

            return remoteStatus.then(function(result) {
                let assets = result.assets;
                this.remoteAssets = result.assets;

                // get artboards
                let artboards = [];
                let doc = sketch.getDocument();

                if (doc) {
                    let mspage = doc.currentPage();
                    let msartboards = mspage.artboards();

                    for (let i = 0; i < msartboards.length; i++) {
                        let msartboard = msartboards[i];

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
                    for (let i = 0; i < artboards.length; i++) {
                        let artboard = artboards[i];

                        for (let id in assets) {
                            if (assets.hasOwnProperty(id)) {
                                let asset = assets[id];
                                let path = asset.path;
                                if (asset.path.indexOf(target.set.path) === 0) {
                                    path = asset.path.replace(target.set.path, '');
                                }

                                if (path + asset.filename == artboard.name + '.' + asset.ext) {
                                    artboard.id = asset.id;
                                    artboard.sha = asset.sha;
                                    artboard.ext = asset.ext;
                                    artboard.attachments = asset.attachments;
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
                    let selectedArtboards = [];
                    let jsdoc = DOM.Document.fromNative(sketch.getDocument());
                    jsdoc.selectedLayers.forEach(function(layer) {
                        if (layer.type === 'Artboard') {
                            selectedArtboards.push(layer.id);
                        }
                    }.bind(this));

                    for (let i = 0; i < artboards.length; i++) {
                        let artboard = artboards[i];
                        if (selectedArtboards.indexOf(artboard.id_external) > -1) {
                            artboard.selected = true;
                        }
                    }
                }

                let data = {
                    artboards: artboards.reverse(),
                    target: target
                };

                return data;
            }.bind(this));
        }.bind(this));
    }

    exportArtboard(artboard, doc) {
        return new Promise(function(resolve, reject) {
            let files = [];
            let predicate = NSPredicate.predicateWithFormat('objectID == %@', artboard.id_external);
            let msartboard = sketch.findFirstLayer(predicate, nil, MSArtboardGroup);

            // Export artboard image -> traditional MSExportRequest for better naming control
            let imageFormat = MSExportFormat.alloc().init();
            imageFormat.setFileFormat('png');
            imageFormat.setScale(this.pixelRatio); // @2x

            let path = filemanager.getExportPath() + artboard.name + '.png';


            let exportRequest = MSExportRequest.exportRequestsFromExportableLayer_exportFormats_useIDForName(msartboard, [imageFormat], true).firstObject();

            doc.saveArtboardOrSlice_toFile(exportRequest, path);

            files.push({
                name: artboard.name,
                ext: 'png',
                id_external: artboard.id_external,
                id: artboard.id,
                sha: artboard.sha,
                path: path,
                type: 'artboard'
            });

            // Export artboard structure -> via JS API as its not possible to export JSON with MSExportRequest
            let jsartboard = DOM.Artboard.fromNative(msartboard);

            // Create an own disconnected Artboard to preprocess and optimize data
            let detachedArtboard = jsartboard.duplicate();
            detachedArtboard.name = 'data';

            // Save origin info
            let jsdoc = DOM.Document.fromNative(doc);
            Settings.setLayerSettingForKey(detachedArtboard, 'document', { id: jsdoc.id, page: { id: jsdoc.selectedPage.id, name: jsdoc.selectedPage.name }});

            // Optimize layers
            detachedArtboard.layers.forEach(function(layer) {
                if (layer.style && layer.style.fills) {
                    // Remove image fills
                    let index = layer.style.fills.length;
                    while (--index >= 0) {
                        let fill = layer.style.fills[index];
                        if (fill.fill == API.Style.FillType.Pattern && fill.pattern.image) {
                            layer.sketchObject.style().removeStyleFillAtIndex(index);
                        }
                    }
                }

                if (layer.type == 'SymbolInstance') {
                    let symbolProps = {
                        symbolId: layer.master.symbolId,
                        name: layer.master.name
                    };

                    // Save symbol properties to layer
                    Settings.setLayerSettingForKey(layer, 'symbol', symbolProps);

                    layer.detach({recursively: true}); // inline symbols
                }
                else if (layer.type == 'Image') {
                    // Remove image data
                    layer.image = null; // remove image data
                }
            }.bind(this));

            detachedArtboard.parent = null;

            DOM.export(detachedArtboard, {
                formats: 'json',
                output: filemanager.getExportPath(),
                overwriting: true
            });

            files.push({
                name: detachedArtboard.name,
                ext: 'json',
                id_external: artboard.id_external,
                id: artboard.id,
                path: filemanager.getExportPath() + detachedArtboard.name + '.json',
                type: 'attachment'
            });

            // Export formats -> traditional MSExportRequest for better naming control
            function exportFormats(layer) {
                layer.exportFormats.forEach(function(format) {

                    let name = '';
                    if (format.prefix && format.prefix !== 'null') {
                        name += format.prefix;
                    }

                    name += layer.name;

                    if (format.suffix && format.suffix !== 'null') {
                        name += format.suffix;
                    }

                    let path = filemanager.getExportPath() + name + '.' + format.fileFormat;

                    let layerFormat = MSExportFormat.alloc().init();
                    layerFormat.setFileFormat(format.fileFormat);
                    layerFormat.setScale(format.size);

                    let exportRequest = MSExportRequest.exportRequestsFromExportableLayer_exportFormats_useIDForName(layer.sketchObject, [layerFormat], true).firstObject();
                    doc.saveArtboardOrSlice_toFile(exportRequest, path);

                    files.push({
                        name: name,
                        ext: format.fileFormat,
                        id_external: layer.id,
                        id: layer.id,
                        path: path,
                        type: 'attachment'
                    });
                });

                if (layer.layers) {
                    layer.layers.forEach(exportFormats)
                }
            }

            exportFormats(detachedArtboard);

            resolve(files);
        }.bind(this));
    }

    uploadArtboards(artboards) {
        // sequence artboard export and upload
        this.uploadInProgress = true;

        return target.getTarget().then(function(target) {
            let doc = sketch.getDocument();
            if (!doc) {
                return Promise.reject('No document found');
            }
            else {
                let artboardChanged = true;

                return artboards.reduce(function(sequence, artboard) {
                    return sequence.then(function() {
                        return this.exportArtboard(artboard, doc);
                    }.bind(this)).then(function(files) {
                        return files.reduce(function(uploadsequence, file) {
                            return uploadsequence.then(function(assetId) {
                                if (file.type === 'artboard') {
                                    if (artboard.sha != shaFile(file.path)) {
                                        artboardChanged = true;
                                        return filemanager.uploadFile({
                                            path: file.path,
                                            name: file.name + '.' + file.ext,
                                            id: file.id,
                                            id_external: file.id_external,
                                            pixel_ratio: this.pixelRatio,
                                            folder: target.set.path,
                                            project: target.project.id,
                                            type: file.type
                                        }).then(function(data) {
                                            filemanager.deleteFile(file.path);
                                            artboard.sha = data.sha;
                                            artboard.id = data.id;
                                            artboard.nochanges = false;

                                            return data.id;
                                        }.bind(this));
                                    }
                                    else {
                                        artboardChanged = false;
                                        filemanager.deleteFile(file.path);
                                        artboard.nochanges = true;
                                        return artboard.id;
                                    }
                                }
                                else if (file.type === 'attachment') {
                                    let status = this.getRemoteStatusForAttachment(artboard, file);

                                    if (artboardChanged || status.sha != shaFile(file.path)) {
                                        return filemanager.uploadFile({
                                            path: file.path,
                                            name: file.name + '.' + file.ext,
                                            type: file.type,
                                            asset_id: assetId
                                        }).then(function(data) {
                                            filemanager.deleteFile(file.path);
                                            status.sha = data.sha;
                                            return assetId;
                                        }.bind(this));
                                    }
                                    else {
                                        filemanager.deleteFile(file.path);
                                        return assetId;
                                    }
                                }
                            }.bind(this));
                        }.bind(this), Promise.resolve()).then(function() {
                            if (isWebviewPresent('frontifymain')) {
                                sendToWebview('frontifymain', 'artboardUploaded(' + JSON.stringify(artboard) + ')');
                            }
                            return true;
                        }).catch(function(err) {
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

    getRemoteStatusForAttachment(artboard, file) {
        let status = null;

        if (artboard.attachments && artboard.attachments.length > 0) {
            artboard.attachments.forEach(function(attachment) {
                if (file.name == attachment.name && file.ext == attachment.ext) {
                    status = attachment
                }
            }.bind(this));
        }

        if (!status) {
            status = {
                sha: null
            };
        }

        return status;
    }

    showArtboards(skipRemote) {
        if (!this.uploadInProgress) {
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

