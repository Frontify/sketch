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
            var path = filemanager.getExportPath() + artboard.name + '.png';
            var format = MSExportFormat.alloc().init();
            format.setFileFormat('png');
            format.setScale(this.pixelRatio); // @2x

            var predicate = NSPredicate.predicateWithFormat('objectID == %@', artboard.id_external);
            var msartboard = sketch.findFirstLayer(predicate, nil, MSArtboardGroup, doc);
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

    uploadArtboards(artboards) {
        // sequence artboard export and upload
        this.uploadInProgress = true;

        return target.getTarget().then(function(target) {
            var doc = sketch.getDocument();
            if (!doc) {
                return Promise.reject('No document found');
            }
            else {
                return artboards.reduce(function(sequence, artboard) {
                    return sequence.then(function() {
                        return this.exportArtboard(artboard, doc);
                    }.bind(this)).then(function(result) {
                        if (artboard.sha != shaFile(result.path)) {
                            return filemanager.uploadFile({
                                path: result.path,
                                name: result.name + '.' + result.ext,
                                id: result.id,
                                id_external: result.id_external,
                                pixel_ratio: this.pixelRatio,
                                folder: target.set.path,
                                project: target.project.id,
                                type: 'artboard'
                            }).then(function(data) {
                                filemanager.deleteFile(result.path);
                                artboard.sha = data.sha;
                                artboard.id = data.id;
                                artboard.nochanges = false;
                                // source file download
                                if (isWebviewPresent('frontifymain')) {
                                    sendToWebview('frontifymain', 'artboardUploaded(' + JSON.stringify(artboard) + ')');
                                }
                                return true;
                            }).catch(function(e) {
                                if (isWebviewPresent('frontifymain')) {
                                    sendToWebview('frontifymain', 'artboardUploadFailed(' + JSON.stringify(artboard) + ')');
                                }
                                return true;
                            });
                        }
                        else {
                            filemanager.deleteFile(result.path);
                            artboard.nochanges = true;
                            if (isWebviewPresent('frontifymain')) {
                                sendToWebview('frontifymain', 'artboardUploaded(' + JSON.stringify(artboard) + ')');
                            }
                            return true;
                        }
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

