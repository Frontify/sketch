import fetch from '../helpers/fetch';
import shaFile from '../helpers/shaFile';
import writeJSON from '../helpers/writeJSON';
import sketch from './sketch';
import target from './target';
import filemanager from './filemanager';
import asset from './asset';
import { isWebviewPresent, sendToWebview } from 'sketch-module-web-view/remote';

let API = require('sketch');
let DOM = require('sketch/dom');
let Settings = require('sketch/settings');

class Artboard {
    constructor() {
        this.pixelRatio = 2;
        this.remoteAssets = null;
        this.uploadInProgress = false;
    }

    updateProgress(options, progress) {
        if (isWebviewPresent('frontifymain')) {
            sendToWebview(
                'frontifymain',
                'artboardUploadProgress(' +
                    JSON.stringify({
                        id: options.id,
                        id_external: options.id_external,
                        progress: progress.fractionCompleted() * 100,
                    }) +
                    ')'
            );
        }
    }

    getArtboards(skipRemote) {
        return target.getTarget().then(
            function (target) {
                let remoteStatus = null;
                if (skipRemote && this.remoteAssets) {
                    remoteStatus = Promise.resolve({ assets: this.remoteAssets });
                } else {
                    // load remote assets status
                    remoteStatus = fetch(
                        '/v1/assets/status/' +
                            target.project.id +
                            '?include_count_annotation=true&include_attachments=true&path=' +
                            encodeURIComponent(target.set.path)
                    );
                }

                return remoteStatus.then(
                    function (result) {
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
                                    name: '' + msartboard.name().replace(/\s*\/\s*/g, '/'),
                                    ext: 'png',
                                    sha: null,
                                    state: 'new',
                                    target: '',
                                    modified: null,
                                    modifier_name: null,
                                    modified_localized_ago: null,
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
                            jsdoc.selectedLayers.forEach(
                                function (layer) {
                                    if (layer.type == 'Artboard' || layer.type == 'SymbolMaster') {
                                        selectedArtboards.push(layer.id);
                                    }
                                }.bind(this)
                            );

                            for (let i = 0; i < artboards.length; i++) {
                                let artboard = artboards[i];
                                if (selectedArtboards.indexOf(artboard.id_external) > -1) {
                                    artboard.selected = true;
                                }
                            }
                        }

                        let data = {
                            artboards: artboards.reverse(),
                            target: target,
                        };

                        return data;
                    }.bind(this)
                );
            }.bind(this)
        );
    }

    exportArtboard(artboard, doc) {
        return new Promise(
            function (resolve) {
                let files = [];
                let predicate = NSPredicate.predicateWithFormat('objectID == %@', artboard.id_external);
                let msartboard = sketch.findFirstLayer(predicate, nil, MSArtboardGroup, doc);

                // Export artboard image -> traditional MSExportRequest for better naming control
                let imageFormat = MSExportFormat.alloc().init();
                imageFormat.setFileFormat('png');
                imageFormat.setScale(this.pixelRatio); // @2x

                let path = filemanager.getExportPath() + artboard.name + '.png';
                let exportRequest = MSExportRequest.exportRequestsFromExportableLayer_exportFormats_useIDForName(
                    msartboard,
                    [imageFormat],
                    true
                ).firstObject();

                doc.saveArtboardOrSlice_toFile(exportRequest, path);

                files.push({
                    name: artboard.name,
                    ext: 'png',
                    id_external: artboard.id_external,
                    id: artboard.id,
                    sha: artboard.sha,
                    path: path,
                    type: 'artboard',
                });

                // Export artboard structure -> via JS API as its not possible to export JSON with MSExportRequest
                let jsartboard = DOM.Artboard.fromNative(msartboard);

                // Export the artboard's data first to preprocess and optimize data
                let artboardExport = DOM.export(jsartboard, {
                    formats: 'json',
                    output: false,
                });

                // Export formats -> traditional MSExportRequest for better naming control
                files = files.concat(this.exportFormats(doc, jsartboard));
                // Save origin info
                let jsdoc = DOM.Document.fromNative(doc);

                this.setLayerSettingForKey(artboardExport, 'meta', {
                    document: { id: jsdoc.id, path: jsdoc.path },
                    page: { id: jsdoc.selectedPage.id, name: jsdoc.selectedPage.name },
                    sketch: { version: '' + API.version.sketch, api: API.version.api },
                    // converting 'sketch.version' to string is needed to not lose it at JSON.stringify
                });

                // Resolve Symbols
                artboardExport.layers = this.resolveSymbolLayers(artboardExport.layers);

                // Optimize layers
                artboardExport.layers = this.optimizeLayers(artboardExport.layers);

                const exportName = 'data';
                const exportPath = filemanager.getExportPath();
                writeJSON(exportName, artboardExport, exportPath);

                files.push({
                    name: exportName,
                    ext: 'json',
                    id_external: artboard.id_external,
                    id: artboard.id,
                    path: exportPath + exportName + '.json',
                    type: 'attachment',
                });

                resolve(files);
            }.bind(this)
        );
    }

    /***
     * Local counterpart to Settings.setLayerSettingsForKey for already exported structures
     * */
    setLayerSettingForKey(layer, key, value) {
        let settings;
        const data = JSON.stringify(value);

        if (!layer.hasOwnProperty('userInfo')) {
            layer['userInfo'] = {};
        }

        if (!layer['userInfo'].hasOwnProperty('com.frontify.sketch')) {
            settings = layer['userInfo']['com.frontify.sketch'] = {};
        }

        settings[key] = data;
    }

    optimizeLayers(layers) {
        const optimize = (layer) => {
            layer = this.layerRemoveImageFills(layer);

            if (layer._class === 'group') {
                layer.layers = layer.layers.map(optimize);
            } else if (layer._class === 'bitmap') {
                layer = this.layerReplaceImageData(layer);
            }

            return layer;
        };

        return layers.map(optimize);
    }

    /**
     * Removes base64 image fills, because we don't need that extra data
     * @param layer
     * @returns {{style}|*}
     */

    layerRemoveImageFills(layer) {
        // REMOVE IMAGE FILLS TO REDUCE THE JSON WEIGHT
        if (layer.style && layer.style.fills) {
            // Remove image fills
            let index = layer.style.fills.length;
            while (--index >= 0) {
                let fill = layer.style.fills[index];

                if (fill.fillType === 4 && fill.image) {
                    layer.style.fills.splice(index, 1);
                }
            }
        }

        return layer;
    }

    /**
     *  Replaces base64 image with a lightweigt 1x1 px placeholder, because we don't need that extra asset
     * @param layer
     * @returns {{image}|*}
     */
    layerReplaceImageData(layer) {
        if (layer.image && layer.image.data && layer.image.data._data) {
            layer.image.data._data =
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        }

        return layer;
    }

    resolveSymbolLayers(layers) {
        const resolve = (layer) => {
            if (layer._class === 'symbolInstance') {
                return this.getDetachedGroupByExportedSymbolLayer(layer);
            }

            if (layer._class === 'group' || layer._class === 'shapeGroup') {
                layer.layers = layer.layers.map(resolve);
            }

            return layer;
        };

        return layers.map(resolve);
    }

    /**
     * Accepts an exported symbold layer and returns a detached version in export json format
     * Nested symbols are detachted deeply
     * @param exportedLayer (a layer after export to json format)
     */

    getDetachedGroupByExportedSymbolLayer(exportedLayer) {
        const document = DOM.getSelectedDocument();
        const layerId = exportedLayer.do_objectID;
        const originalSymbolInstance = document.getLayerWithID(layerId);

        // Keep name and rename duplicate to recognize it if something is broken during export
        const layerName = originalSymbolInstance.name;
        const duplicatedSymbolInstance = originalSymbolInstance.duplicate();
        duplicatedSymbolInstance.name = '[export copy] ' + layerName;

        const detachedGroup = this.recursivelyDetachSymbols(duplicatedSymbolInstance);

        // Get data of the symbolInstance duplicate
        const detachedGroupExport = DOM.export(detachedGroup, {
            formats: 'json',
            output: false,
        });

        // Reset original name
        detachedGroupExport.name = layerName;

        // Remove the duplicate of the symbolInstance
        detachedGroup.remove();

        // Set layerId of the old symbol instance to the exported group,
        // because we want to keep that id to match exporables (attachments)
        detachedGroupExport.do_objectID = layerId;

        return detachedGroupExport;
    }

    /**
     * The recursion is done manually, so we can add meta to separated symbols before we detach them.
     * In this way, we can later determine that it was a symbol.
     * @param layer
     * @returns {void | *}
     */

    recursivelyDetachSymbols(layer) {
        if (layer.type === 'Group') {
            layer.layers.forEach((layer) => {
                this.recursivelyDetachSymbols(layer);
            });

            return;
        } else if (layer.type !== 'SymbolInstance') {
            /* if it's not a symbol, there's nothing to do */
            return;
        }

        const document = DOM.getSelectedDocument();
        const originalSymbolMaster = document.getSymbolMasterWithID(layer.symbolId);

        if (!originalSymbolMaster) {
            console.error('symbol Master with ID ' + layer.symbolId + 'not found');
        }

        const meta = {
            isDetachedSymbolGroup: true,
            symbolMaster: {
                id: originalSymbolMaster.id,
                symbolId: originalSymbolMaster.symbolId,
                library: originalSymbolMaster.getLibrary(),
            },
        };

        /* add meta info to symbolInstance before detaching it */
        Settings.setLayerSettingForKey(layer, 'meta', meta);

        let detachedlayer = layer.detach({ recursively: false });

        /* detached layer is a now a group, so do detaching for its layers again */
        this.recursivelyDetachSymbols(detachedlayer);

        return detachedlayer;
    }

    exportFormats(doc, layer) {
        let files = [];

        layer.exportFormats.forEach((format) => {
            let name = '';
            if (format.prefix && format.prefix !== 'null') {
                name += format.prefix;
            }

            name += layer.name;

            if (format.suffix && format.suffix !== 'null') {
                name += format.suffix;
            }

            const timeStamp = Date.now();
            const path = filemanager.getExportPath() + timeStamp + '-' + name + '.' + format.fileFormat;
            const layerSizeAsScaleNumber = this.getLayerScaleNumberFromSizeString(format.size, layer.frame);
            const layerFormat = MSExportFormat.alloc().init();

            layerFormat.setFileFormat(format.fileFormat);
            layerFormat.setScale(layerSizeAsScaleNumber);

            const exportRequest = MSExportRequest.exportRequestsFromExportableLayer_exportFormats_useIDForName(
                layer.sketchObject,
                [layerFormat],
                true
            ).firstObject();
            doc.saveArtboardOrSlice_toFile(exportRequest, path);

            files.push({
                name: name,
                ext: format.fileFormat,
                id_external: layer.id,
                id: layer.id,
                path: path,
                type: 'attachment',
                pixel_ratio: format.size,
            });
        });

        if (layer.layers) {
            layer.layers.forEach((layer) => {
                files = files.concat(this.exportFormats(doc, layer));
            });
        }

        return files;
    }

    uploadArtboards(artboards) {
        // sequence artboard export and upload
        this.uploadInProgress = true;

        return this.getArtboards()
            .then(
                function (data) {
                    let target = data.target;

                    // get the current state of the given artboards
                    artboards = artboards.map(
                        function (artboard) {
                            return data.artboards.find(
                                function (remoteArtboard) {
                                    return remoteArtboard.id_external == artboard.id_external;
                                }.bind(this)
                            );
                        }.bind(this)
                    );

                    let doc = sketch.getDocument();
                    if (!doc) {
                        throw new Error('No document found');
                    } else {
                        return artboards.reduce(
                            function (sequence, artboard) {
                                return sequence
                                    .then(
                                        function () {
                                            return this.exportArtboard(artboard, doc);
                                        }.bind(this)
                                    )
                                    .then(
                                        function (files) {
                                            var artboardProgress = NSProgress.progressWithTotalUnitCount(
                                                10 * files.length + 20
                                            );
                                            artboardProgress.setCompletedUnitCount(0);

                                            var polling = setInterval(
                                                function () {
                                                    this.updateProgress(artboard, artboardProgress);
                                                }.bind(this),
                                                100
                                            );

                                            let artboardChanged = false;
                                            return files
                                                .reduce(
                                                    function (uploadsequence, file) {
                                                        return uploadsequence
                                                            .then(
                                                                function (assetId) {
                                                                    if (file.type === 'artboard') {
                                                                        if (artboard.sha != shaFile(file.path)) {
                                                                            artboardChanged = true;
                                                                            return filemanager
                                                                                .uploadFile(
                                                                                    {
                                                                                        path: file.path,
                                                                                        filename:
                                                                                            file.name + '.' + file.ext,
                                                                                        name: file.name,
                                                                                        id: file.id,
                                                                                        id_external: file.id_external,
                                                                                        pixel_ratio: this.pixelRatio,
                                                                                        folder: target.set.path,
                                                                                        project: target.project.id,
                                                                                        type: file.type,
                                                                                    },
                                                                                    artboardProgress
                                                                                )
                                                                                .then(
                                                                                    function (data) {
                                                                                        filemanager.deleteFile(
                                                                                            file.path
                                                                                        );
                                                                                        this.updateProgress(
                                                                                            artboard,
                                                                                            artboardProgress
                                                                                        );
                                                                                        artboard.sha = data.sha;
                                                                                        artboard.id = data.id;
                                                                                        artboard.nochanges = false;

                                                                                        return data.id;
                                                                                    }.bind(this)
                                                                                );
                                                                        } else {
                                                                            artboardChanged = false;
                                                                            artboardProgress.setCompletedUnitCount(
                                                                                artboardProgress.completedUnitCount() +
                                                                                    10
                                                                            );
                                                                            this.updateProgress(
                                                                                artboard,
                                                                                artboardProgress
                                                                            );
                                                                            filemanager.deleteFile(file.path);
                                                                            artboard.nochanges = true;
                                                                            return artboard.id;
                                                                        }
                                                                    } else if (file.type === 'attachment') {
                                                                        let status = this.getRemoteStatusForAttachment(
                                                                            artboard,
                                                                            file
                                                                        );

                                                                        if (
                                                                            artboardChanged ||
                                                                            status.sha != shaFile(file.path)
                                                                        ) {
                                                                            let filename;

                                                                            if (file.ext === 'json') {
                                                                                filename = file.name + '.' + file.ext;
                                                                            } else {
                                                                                // Generate unique filenames for exportables. That prevents same named layers to overwrite each others exportables.
                                                                                filename =
                                                                                    file.id_external +
                                                                                    '-' +
                                                                                    file.pixel_ratio +
                                                                                    '.' +
                                                                                    file.ext;
                                                                            }

                                                                            return filemanager
                                                                                .uploadFile(
                                                                                    {
                                                                                        path: file.path,
                                                                                        filename: filename,
                                                                                        name: file.name,
                                                                                        id_external: file.id_external,
                                                                                        type: file.type,
                                                                                        asset_id: assetId,
                                                                                        pixel_ratio: file.pixel_ratio,
                                                                                    },
                                                                                    artboardProgress
                                                                                )
                                                                                .then(
                                                                                    function (data) {
                                                                                        filemanager.deleteFile(
                                                                                            file.path
                                                                                        );
                                                                                        this.updateProgress(
                                                                                            artboard,
                                                                                            artboardProgress
                                                                                        );
                                                                                        status.sha = data.sha;
                                                                                        return assetId;
                                                                                    }.bind(this)
                                                                                );
                                                                        } else {
                                                                            filemanager.deleteFile(file.path);
                                                                            artboardProgress.setCompletedUnitCount(
                                                                                artboardProgress.completedUnitCount() +
                                                                                    10
                                                                            );
                                                                            this.updateProgress(
                                                                                artboard,
                                                                                artboardProgress
                                                                            );
                                                                            return assetId;
                                                                        }
                                                                    }
                                                                }.bind(this)
                                                            )
                                                            .catch(
                                                                function (err) {
                                                                    console.error(err);
                                                                    throw err;
                                                                }.bind(this)
                                                            );
                                                    }.bind(this),
                                                    Promise.resolve()
                                                )
                                                .then(
                                                    function (assetId) {
                                                        // start import of asset
                                                        asset.import(assetId); /* calls the import API */
                                                        artboardProgress.setCompletedUnitCount(
                                                            artboardProgress.completedUnitCount() + 20
                                                        );
                                                        this.updateProgress(artboard, artboardProgress);
                                                    }.bind(this)
                                                )
                                                .then(
                                                    function (data) {
                                                        clearInterval(polling);
                                                        if (isWebviewPresent('frontifymain')) {
                                                            sendToWebview(
                                                                'frontifymain',
                                                                'artboardUploaded(' + JSON.stringify(artboard) + ')'
                                                            );
                                                        }
                                                        return true;
                                                    }.bind(this)
                                                )
                                                .catch(
                                                    function (err) {
                                                        clearInterval(polling);
                                                        if (isWebviewPresent('frontifymain')) {
                                                            sendToWebview(
                                                                'frontifymain',
                                                                'artboardUploadFailed(' + JSON.stringify(artboard) + ')'
                                                            );
                                                        }
                                                        throw err;
                                                    }.bind(this)
                                                );
                                        }.bind(this)
                                    )
                                    .catch(
                                        function (err) {
                                            console.error(err);
                                            throw err;
                                        }.bind(this)
                                    );
                            }.bind(this),
                            Promise.resolve()
                        );
                    }
                }.bind(this)
            )
            .then(
                function (data) {
                    this.uploadInProgress = false;
                }.bind(this)
            )
            .catch(
                function (err) {
                    this.uploadInProgress = false;
                    console.error(err);
                }.bind(this)
            );
    }

    getRemoteStatusForAttachment(artboard, file) {
        let status = null;

        if (artboard.attachments && artboard.attachments.length > 0) {
            artboard.attachments.forEach(
                function (attachment) {
                    if (file.name == attachment.name && file.ext == attachment.ext) {
                        status = attachment;
                    }
                }.bind(this)
            );
        }

        if (!status) {
            status = {
                sha: null,
            };
        }

        return status;
    }

    showArtboards(skipRemote) {
        if (!this.uploadInProgress) {
            this.getArtboards(skipRemote)
                .then(
                    function (data) {
                        if (isWebviewPresent('frontifymain')) {
                            sendToWebview('frontifymain', 'showArtboards(' + JSON.stringify(data) + ')');
                        }
                    }.bind(this)
                )
                .catch(
                    function (e) {
                        console.error(e);
                    }.bind(this)
                );
        } else {
            console.log('upload in progress');
        }
    }

    /**
     *
     * @param sizeString: e.g. "2x, 100w, 300h"
     * @param layerFrame
     */
    getLayerScaleNumberFromSizeString(sizeString, layerFrame) {
        let scale = 1;

        if (sizeString.indexOf('x') !== -1) {
            scale = parseFloat(sizeString);
        } else if (sizeString.indexOf('w') !== -1) {
            const widthInPx = parseInt(sizeString);
            scale = (1 / layerFrame.width) * widthInPx;
        } else if (sizeString.indexOf('h') !== -1) {
            // there is a given height
            const heightInPx = parseInt(sizeString);
            scale = (1 / layerFrame.height) * heightInPx;
        }

        return scale;
    }
}

export default new Artboard();
