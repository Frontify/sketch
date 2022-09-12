// Sketch API
import sketch, { Document, Settings } from 'sketch';

// Helpers
import fetch from '../helpers/fetch';
import shaFile from '../helpers/shaFile';
import writeJSON from '../helpers/writeJSON';
import { findFirstLayer, getDocument } from '../helpers/sketch';

import asset from './asset';
import target from './target';
import FileManager from './FileManager';
import UploadManager from './UploadManager';

// IPC
import { isWebviewPresent } from 'sketch-module-web-view/remote';
import { frontend } from '../helpers/ipc';

// Error
import { Error } from './error';

// Profiler
import { Profiler } from './Profiler';
const profiler = new Profiler();

const SHA_KEY = 'com.frontify.artboard.sha';
const DESTINATION_KEY = 'com.frontify.artboard.destinations';

class Artboard {
    constructor() {
        this.pixelRatio = 2;
        this.remoteAssets = null;
        this.uploadInProgress = false;
    }
    cancelUpload() {
        this.uploadInProgress = false;
    }

    skipUpload(options, progress) {
        frontend.send('progress', {
            state: 'skipping-upload',
            status: 'skipping-upload',
            progress: progress.fractionCompleted() * 100,
            ...options,
        });
    }

    updateProgress(options, progress) {
        frontend.send('progress', {
            state: 'uploading',
            status: 'uploading',
            progress: progress.fractionCompleted() * 100,
            ...options,
        });
    }
    finishUpload(options) {
        frontend.send('progress', {
            state: 'upload-complete',
            status: 'upload-complete',
            progress: 100,
            ...options,
        });
    }
    failUpload(options, error) {
        frontend.send('progress', {
            state: 'upload-failed',
            status: 'upload-failed',
            progress: 0,
            error,
            ...options,
        });
    }

    queueUpload(options) {
        frontend.send('progress', {
            state: 'upload-queued',
            status: 'upload-queued',
            progress: 0,
            ...options,
        });
    }

    getArtboards(skipRemote) {
        return target.getTarget().then(
            function (target) {
                let remoteStatus = null;
                if (skipRemote && this.remoteAssets) {
                    remoteStatus = Promise.resolve({ assets: this.remoteAssets });
                } else {
                    // load remote assets status

                    // TODO: Replace path with external ID

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
                        let doc = getDocument();

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
                            let jsdoc = Document.fromNative(getDocument());
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
                let msartboard = findFirstLayer(predicate, nil, MSArtboardGroup, doc);

                // Export artboard image -> traditional MSExportRequest for better naming control
                let imageFormat = MSExportFormat.alloc().init();
                imageFormat.setFileFormat('png');
                imageFormat.setScale(this.pixelRatio); // @2x

                let path = FileManager.getExportPath() + artboard.name + '.png';
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
                    dirty: artboard.dirty,
                });

                // Export artboard structure -> via JS API as its not possible to export JSON with MSExportRequest
                let jsartboard = sketch.Artboard.fromNative(msartboard);

                // Export the artboard's data first to preprocess and optimize data
                let artboardExport = sketch.export(jsartboard, {
                    formats: 'json',
                    output: false,
                });

                // Export formats -> traditional MSExportRequest for better naming control
                files = files.concat(this.exportFormats(doc, jsartboard));
                // Save origin info
                let jsdoc = Document.fromNative(doc);

                // This metadata appears to be required for the Inspect / Import API.
                let meta = {
                    document: { id: jsdoc.id, path: jsdoc.path },
                    page: { id: jsdoc.selectedPage.id, name: jsdoc.selectedPage.name },
                    sketch: { version: '' + sketch.version.sketch, api: sketch.version.api },
                    // converting 'sketch.version' to string is needed to not lose it at JSON.stringify
                };

                /**
                 * Here used to be a call that didn’t work as expected:
                 *
                 * [REMOVED] this.setLayerSettingForKey(artboardExport, 'meta', meta);
                 *
                 * Replaced by the following line:
                 */
                artboardExport['userInfo']['com.frontify.sketch'] = { meta: JSON.stringify(meta) };

                // Resolve Symbols
                artboardExport.layers = this.resolveSymbolLayers(artboardExport.layers);

                // Optimize layers
                artboardExport.layers = this.optimizeLayers(artboardExport.layers);

                /**
                 * If we want to allow parallel uploads, we need to export data files with unique file names.
                 * data.json -> data-ABCD-1234-EFGH-5678.json
                 *
                 * The Frontify API expects a "data.json" for the inspect/import feature.
                 */
                const uniqueExportName = `data-${artboard.id}`;
                const exportPath = FileManager.getExportPath();

                writeJSON(uniqueExportName, artboardExport, exportPath);

                files.push({
                    name: 'data',
                    ext: 'json',
                    id_external: artboard.id_external,
                    id: artboard.id,
                    path: exportPath + uniqueExportName + '.json',
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
        let settings = {};
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
        const document = Document.getSelectedDocument();
        const layerId = exportedLayer.do_objectID;
        const originalSymbolInstance = document.getLayerWithID(layerId);

        // Keep name and rename duplicate to recognize it if something is broken during export
        const layerName = originalSymbolInstance.name;
        const duplicatedSymbolInstance = originalSymbolInstance.duplicate();
        duplicatedSymbolInstance.name = '[export copy] ' + layerName;

        const detachedGroup = this.recursivelyDetachSymbols(duplicatedSymbolInstance);

        // Get data of the symbolInstance duplicate
        const detachedGroupExport = sketch.export(detachedGroup, {
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

    layerIsDetachableSymbolInstance(layer) {
        // SymbolInstance with empty layer.symbolId is used if symbol overrides
        // are defined and override property is set to 'no symbol' (Sketch 88)
        return layer.type === 'SymbolInstance' && !!layer.symbolId;
    }

    /**
     * The recursion is done manually, so we can add meta to separated symbols before we detach them.
     * In this way, we can later determine that it was a symbol.
     * @param layer
     * @returns {void | *}
     */

    recursivelyDetachSymbols(layer) {
        if (layer === null) {
            return;
        } else if (layer.type === 'Group') {
            layer.layers.forEach((layer) => {
                this.recursivelyDetachSymbols(layer);
            });

            return;
        } else if (this.layerIsDetachableSymbolInstance(layer) === false) {
            return;
        }

        const document = Document.getSelectedDocument();
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

        /* fallback for undetachable symbols (e.g. symbols without layers) */
        if (detachedlayer === null) {
            detachedlayer = this.getFallbackLayerFromUndetachableSymbol(layer);
            Settings.setLayerSettingForKey(detachedlayer, 'meta', meta);

            /* remove remaining duplicate because we return an additionally created layer */
            layer.remove();
        }

        /* if the symbol was detachable, the detached layer is a now a group, so do detaching for its layers again */
        if (detachedlayer?.type === 'Group') {
            this.recursivelyDetachSymbols(detachedlayer);
        }

        return detachedlayer;
    }

    getFallbackLayerFromUndetachableSymbol(symbolLayer) {
        const propertiesBlacklist = ['id', 'type', 'symbolId', 'overrides'];
        const fallbackLayerProperties = {};

        for (const property in symbolLayer) {
            if (propertiesBlacklist.includes(property)) {
                continue;
            }

            fallbackLayerProperties[property] = symbolLayer[property];
        }

        const fallbackLayer = new Document.Group(fallbackLayerProperties);

        return fallbackLayer;
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
            const path = FileManager.getExportPath() + timeStamp + '-' + name + '.' + format.fileFormat;
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

    uploadArtboards(artboards, brandID, force = false) {
        // sequence artboard export and upload

        this.uploadInProgress = true;

        /**
         * Force Upload
         *
         */

        let doc = getDocument();
        if (!doc) {
            throw new Error('No document found');
        } else {
            // 1. Export each artboard
            return artboards.reduce(
                function (sequence, artboard) {
                    return sequence
                        .then(
                            function () {
                                frontend.send('progress', {
                                    state: 'exporting',
                                    status: 'exporting',
                                    progress: 23,
                                    ...artboard,
                                });
                                return this.exportArtboard(artboard, doc);
                            }.bind(this)
                        )
                        .then(
                            function (files) {
                                // 2. Compute the upload progress based on the exported files
                                var artboardProgress = NSProgress.progressWithTotalUnitCount(10 * files.length + 20);
                                artboardProgress.setCompletedUnitCount(0);

                                // 3. Start polling for the upload progress
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
                                                        // Figure out if the upload has been canceled in the meantime

                                                        if (this.uploadInProgress == false) {
                                                            this.failUpload(artboard);
                                                            clearInterval(polling);
                                                            return artboard.id;
                                                        }

                                                        if (file.type === 'artboard') {
                                                            let artboardDidChange = shaFile(file.path) != artboard.sha;
                                                            // Proceed if the artboard has changes or if it has never been uploaded
                                                            // If it has changes, the dirty flag will be true
                                                            // If it has never been uploaded, the id will be null
                                                            let proceed = artboard.dirty || !artboard.id;
                                                            let newAsset = !artboard.id;

                                                            if (force || newAsset || (proceed && artboardDidChange)) {
                                                                artboardChanged = true;

                                                                let fileInfo = {
                                                                    path: file.path,
                                                                    filename: file.name + '.' + file.ext,
                                                                    name: file.name,
                                                                    id: file.id,
                                                                    id_external: file.id_external,
                                                                    pixel_ratio: this.pixelRatio,
                                                                    folder: artboard.target.remote_path,
                                                                    project: artboard.target.remote_project_id,
                                                                    type: file.type,
                                                                };

                                                                return UploadManager.uploadFile(
                                                                    fileInfo,
                                                                    artboardProgress
                                                                )
                                                                    .then(
                                                                        function (data) {
                                                                            // Uploaded

                                                                            let destination = {
                                                                                remote_brand_id: brandID,
                                                                                remote_project_id:
                                                                                    artboard.target.remote_project_id,
                                                                                remote_id: data.id,
                                                                                remote_folder_id:
                                                                                    artboard.target.remote_folder_id,
                                                                                remote_path:
                                                                                    artboard.target.remote_path,
                                                                                // This will store the SHA1 of the artboard that has just been uploaded
                                                                                sha: artboard.sha,
                                                                                for: artboard.id_external,
                                                                                // for: artboard.id,
                                                                            };

                                                                            this.patchDestinations(
                                                                                file.id_external,
                                                                                destination
                                                                            );

                                                                            let artboardLayer = sketch.find(
                                                                                `[id="${artboard.id_external}"]`
                                                                            )[0];

                                                                            if (artboardLayer) {
                                                                                this.setSHA(
                                                                                    artboardLayer,
                                                                                    shaFile(file.path)
                                                                                );
                                                                            }

                                                                            // 3. Handle the response from the API
                                                                            FileManager.deleteFile(file.path);

                                                                            // Patch artboard id
                                                                            artboard.target.remote_id = data.id;
                                                                            this.updateProgress(
                                                                                artboard,
                                                                                artboardProgress
                                                                            );
                                                                            // artboard.sha = data.sha;
                                                                            // artboard.id = data.id;
                                                                            // artboard.nochanges = false;

                                                                            return data.id;
                                                                        }.bind(this)
                                                                    )
                                                                    .catch((error) => {
                                                                        console.error(error);
                                                                        this.failUpload(
                                                                            artboard,
                                                                            Error.ASSET_NOT_FOUND
                                                                        );
                                                                    });
                                                            } else {
                                                                // Skip upload because the file hasn’t changed
                                                                // Remove the exported artboard

                                                                artboardChanged = false;
                                                                artboardProgress.setCompletedUnitCount(
                                                                    artboardProgress.completedUnitCount() + 10
                                                                );

                                                                this.skipUpload(artboard, artboardProgress);

                                                                FileManager.deleteFile(file.path);
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
                                                                status.sha != '' + shaFile(file.path)
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
                                                                let fileInfo = {
                                                                    path: file.path,
                                                                    filename: filename,
                                                                    name: file.name,
                                                                    id_external: file.id_external,
                                                                    type: file.type,
                                                                    asset_id: assetId,
                                                                    pixel_ratio: file.pixel_ratio,
                                                                };

                                                                return UploadManager.uploadFile(
                                                                    fileInfo,
                                                                    artboardProgress
                                                                )
                                                                    .then(
                                                                        function (data) {
                                                                            FileManager.deleteFile(file.path);

                                                                            this.updateProgress(
                                                                                artboard,
                                                                                artboardProgress
                                                                            );

                                                                            status.sha = data.sha;

                                                                            return assetId;
                                                                        }.bind(this)
                                                                    )
                                                                    .catch((error) => {
                                                                        this.failUpload(
                                                                            artboard,
                                                                            Error.ATTACHMENT_UPLOAD_FAILED
                                                                        );
                                                                    });
                                                            } else {
                                                                FileManager.deleteFile(file.path);
                                                                artboardProgress.setCompletedUnitCount(
                                                                    artboardProgress.completedUnitCount() + 10
                                                                );
                                                                this.skipUpload(artboard, artboardProgress);
                                                                return assetId;
                                                            }
                                                        }
                                                    }.bind(this)
                                                )
                                                .catch(
                                                    function (err) {
                                                        throw err;
                                                    }.bind(this)
                                                );
                                        }.bind(this),
                                        Promise.resolve()
                                    )
                                    .then(
                                        async function (assetId) {
                                            if (!assetId) {
                                                throw Error.ASSET_NOT_FOUND;
                                            }
                                            // start import of asset
                                            try {
                                                await asset.import(assetId); /* calls the import API */
                                            } catch (error) {
                                                console.log('import error', error);
                                            }
                                            // Import done!
                                            artboardProgress.setCompletedUnitCount(
                                                artboardProgress.completedUnitCount() + 20
                                            );
                                            this.updateProgress(artboard, artboardProgress);
                                        }.bind(this)
                                    )
                                    .then(
                                        function (data) {
                                            // Data from attachment?
                                            clearInterval(polling);
                                            if (isWebviewPresent('frontifymain')) {
                                                // mark artboard as clean

                                                let artboardLayer = sketch.find(`[id="${artboard.id_external}"]`)[0];

                                                if (artboardLayer) {
                                                    Settings.setLayerSettingForKey(artboardLayer, 'dirty', false);
                                                }
                                                this.finishUpload(artboard);
                                            }
                                            return true;
                                        }.bind(this)
                                    )
                                    .catch(
                                        function (error) {
                                            clearInterval(polling);
                                            if (isWebviewPresent('frontifymain')) {
                                                this.failUpload(artboard, error);
                                            }
                                            throw error;
                                        }.bind(this)
                                    );
                            }.bind(this)
                        )
                        .catch(
                            function (err) {
                                throw err;
                            }.bind(this)
                        );
                }.bind(this),
                Promise.resolve()
            );
        }
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

    patchDestinations(artboardID, destination) {
        let layer = sketch.find(`[id="${artboardID}"]`)[0];
        let destinations = Settings.layerSettingForKey(layer, DESTINATION_KEY);
        let patchedDestinations = destinations.map((original) => {
            if (
                original.remote_project_id == destination.remote_project_id &&
                original.remote_path == destination.remote_path
            ) {
                // Patch

                return destination;
            } else {
                return original;
            }
        });

        Settings.setLayerSettingForKey(layer, DESTINATION_KEY, patchedDestinations);
    }

    removeDestinations(artboard) {
        let layer = sketch.find(`[id="${artboard.id}"]`)[0];
        Settings.setLayerSettingForKey(layer, DESTINATION_KEY, []);
    }

    removeDestination(artboard, destination) {
        let layer = sketch.find(`[id="${artboard.id}"]`)[0];
        let destinations = Settings.layerSettingForKey(layer, DESTINATION_KEY);
        let patchedDestinations = destinations.filter((original) => {
            if (
                original.remote_project_id == destination.remote_project_id &&
                original.remote_path == destination.remote_path
            ) {
                // Remove it if it exist
                return false;
            } else {
                // Keep it
                return true;
            }
        });
        Settings.setLayerSettingForKey(layer, DESTINATION_KEY, patchedDestinations);
    }

    setDestinations(artboard, brandID) {
        let destinations = artboard.destinations;
        destinations = destinations.map((destination) => {
            return {
                ...destination,
                for: artboard.id,
                remote_brand_id: destination.remote_brand_id ? destination.remote_brand_id : brandID,
            };
        });

        let layer = sketch.find(`[id="${artboard.id}"]`)[0];
        Settings.setLayerSettingForKey(layer, DESTINATION_KEY, destinations);
    }

    shaForArtboard(artboard) {
        let layer = sketch.find(`[id="${artboard.id}"]`)[0];

        return this.shaForLayer(layer);
    }

    shaForLayer(layer) {
        return Settings.layerSettingForKey(layer, SHA_KEY);
    }

    hasDestinations(artboard) {
        let destinations = Settings.layerSettingForKey(artboard, DESTINATION_KEY) || [];
        return destinations.length > 0;
    }

    setSHA(artboard, sha) {
        let layer = sketch.find(`[id="${artboard.id}"]`)[0];
        Settings.setLayerSettingForKey(layer, SHA_KEY, sha);
    }

    getDestinations(artboard, brandID) {
        let destinations = Settings.layerSettingForKey(artboard, DESTINATION_KEY) || [];

        const invalid = destinations.find((destination) => destination.for != '' + artboard.objectID());
        if (invalid) {
            Settings.setLayerSettingForKey(artboard, DESTINATION_KEY, []);
            return [];
        }

        const destinationsForBrand = destinations.filter(
            (destination) => brandID && destination.remote_brand_id == brandID
        );

        return destinationsForBrand;
    }
    /**
     * readCachedSHA
     *
     * This returns the layer setting containing the SHA.
     * The SHA is computed from the exported artboard .json.
     * The SHA is then stored on the artboard layer as a layer settting.
     *
     * @param { Artboard } artboard
     * @returns String
     */
    readCachedSHA(artboard) {
        return Settings.layerSettingForKey(artboard, SHA_KEY) || '';
    }
    sortedLayersByName(layers) {
        return layers.sort((a, b) => {
            return a.name > b.name ? 1 : -1;
        });
    }
    nativeTypeToJavaScriptType(type) {
        switch (type) {
            case 'MSArtboardGroup':
                return 'Artboard';
            case 'MSSymbolMaster':
                return 'Symbol';
        }
    }

    wrapped(layer, brandID) {
        return {
            sha: Settings.layerSettingForKey(layer, SHA_KEY),
            dirty: Settings.layerSettingForKey(layer, 'dirty'),
            type: this.nativeTypeToJavaScriptType(String(layer.class())),
            name: layer.name().replace(/\s*\/\s*/g, '/'),
            id: '' + layer.objectID(),
            destinations: this.getDestinations(layer, brandID),
        };
    }
    getSelectedArtboardsAndSymbols(brandID) {
        profiler.start('get selected items fast');

        let nativeSketchDocument = NSDocumentController.sharedDocumentController().currentDocument();

        if (!nativeSketchDocument) return;

        const allLayers = nativeSketchDocument.valueForKeyPath('pages.@distinctUnionOfArrays.children');

        const predicate = NSPredicate.predicateWithFormat(
            'isSelected == true AND (className = %@ OR className = %@)',
            'MSArtboardGroup',
            'MSSymbolMaster'
        );

        const allArtboardsAndSymbols = allLayers.filteredArrayUsingPredicate(predicate);

        let collection = [];
        const loop = allArtboardsAndSymbols.objectEnumerator();
        let layer;
        while ((layer = loop.nextObject())) {
            collection.push(this.wrapped(layer, brandID));
        }

        profiler.end();
    }
    emptyResult() {
        return {
            artboards: [],
            total: 0,
            selection: [],
            success: true,
            documentArtboards: [],
        };
    }
    getAllArtboardsAndSymbols(brandID) {
        // It is possible that a file is managed with different accounts using the plugin.
        // The layer settings are specific to the currently active brand.
        if (brandID) {
            Settings.setSessionVariable('com.frontify.sketch.recent.brand.id', '' + brandID);
        }

        profiler.start('get all artboards and symbols');

        try {
            // We’re using the native Sketch document for performance reasons.
            // This allows us to use NSPredicate to get a list of all layers much faster than using
            // the JavaScript API.
            let nativeSketchDocument =
                NSDocumentController.sharedDocumentController().currentDocument() ||
                sketch.getSelectedDocument().sketchObject;

            // Early return if there’s no document
            if (!nativeSketchDocument) return [];

            // Setup NSPredicate. Look for Artboards and Symbols.
            const allLayers = nativeSketchDocument.valueForKeyPath('pages.@distinctUnionOfArrays.children');
            const predicate = NSPredicate.predicateWithFormat(
                'className = %@ OR className = %@',
                'MSArtboardGroup',
                'MSSymbolMaster'
            );
            const allArtboardsAndSymbols = allLayers.filteredArrayUsingPredicate(predicate);

            // Loop through the result and populate the arrays:
            // 1. All tracked artboards and symbols
            // 2. Selected artboards and symbols
            const loop = allArtboardsAndSymbols.objectEnumerator();
            let all = [];
            let layer;
            while ((layer = loop.nextObject())) {
                all.push(this.wrapped(layer, brandID));
            }

            // Sort the arrays by name
            let result = this.sortedLayersByName(all);

            profiler.end();

            return result;
        } catch (error) {
            console.error(error);
            return { success: false };
        }
    }
    getTrackedArtboardsAndSymbols(brandID) {
        // It is possible that a file is managed with different accounts using the plugin.
        // The layer settings are specific to the currently active brand.
        if (brandID) {
            Settings.setSessionVariable('com.frontify.sketch.recent.brand.id', '' + brandID);
        }

        profiler.start('get all artboards and selected');

        try {
            // We’re using the native Sketch document for performance reasons.
            // This allows us to use NSPredicate to get a list of all layers much faster than using
            // the JavaScript API.
            let nativeSketchDocument =
                NSDocumentController.sharedDocumentController().currentDocument() ||
                sketch.getSelectedDocument().sketchObject;

            // Early return if there’s no document
            if (!nativeSketchDocument) return this.emptyResult();

            let trackedArtboardsAndSymbols = [];
            let selectedArtboardsAndSymbols = [];

            // Setup NSPredicate. Look for Artboards and Symbols.
            const allLayers = nativeSketchDocument.valueForKeyPath('pages.@distinctUnionOfArrays.children');
            const predicate = NSPredicate.predicateWithFormat(
                'className = %@ OR className = %@',
                'MSArtboardGroup',
                'MSSymbolMaster'
            );
            const allArtboardsAndSymbols = allLayers.filteredArrayUsingPredicate(predicate);

            // Loop through the result and populate the arrays:
            // 1. All tracked artboards and symbols
            // 2. Selected artboards and symbols
            const loop = allArtboardsAndSymbols.objectEnumerator();
            let layer;
            while ((layer = loop.nextObject())) {
                if (this.hasDestinations(layer)) {
                    trackedArtboardsAndSymbols.push(this.wrapped(layer, brandID));
                }

                if (layer.isSelected()) {
                    selectedArtboardsAndSymbols.push(this.wrapped(layer, brandID));
                }
            }

            // Sort the arrays by name
            let trackedItems = this.sortedLayersByName(trackedArtboardsAndSymbols);
            let selectedItems = this.sortedLayersByName(selectedArtboardsAndSymbols);

            profiler.end();

            let payload = {
                artboards: selectedItems.length ? selectedItems : trackedItems,
                documentArtboards: trackedItems,
                hasSelection: selectedItems.length > 0,
                selection: selectedItems,
                success: true,
            };

            return payload;
        } catch (error) {
            console.error(error);
            return { success: false };
        }
    }

    findExistingAsset(artboard, uploadDestination) {
        return uploadDestination.files.find((file) => file.name.replace('.png', '') == artboard.name);
    }
    overrideDestinations(artboards, uploadDestination) {
        return artboards.map((artboard) => {
            /**
             * 2 possible scenarios:
             *
             * A) The artboard has no existing destinations:
             *      -> add the new destination
             * B) The artboard has existing destinations:
             *      && the "remote_project_id" and the "remote_path" are:
             *          -> same: return
             *          -> different: replace the existing destinations with the new destination
             */

            // Replace artboard if it has the same name

            let existingAsset = this.findExistingAsset(artboard, uploadDestination);

            let remote_id = existingAsset ? existingAsset.id : null;

            let newDestination = {
                remote_project_id: uploadDestination.project.id,
                remote_id: remote_id,
                remote_folder_id: uploadDestination.folder.id,
                remote_path: `/${uploadDestination.folderPath}/`,
            };
            // force override, because another artboard with that name already exists remotely
            if (remote_id) {
                artboard.destinations = [newDestination];
            }

            // By default, we assign a single new destination.
            // But in case that we find an existing destination, we’ll use the original destinations.
            let patchedDestinations = [newDestination];
            let existingDestinations = artboard.destinations.length > 0;

            if (existingDestinations) {
                // Compare
                let match = false;
                artboard.destinations.forEach((destination) => {
                    let sameProject = destination.remote_project_id == uploadDestination.project.id;
                    let samePath = destination.remote_path == `/${uploadDestination.folderPath}/`;
                    if (sameProject && samePath) {
                        // keep it
                        match = true;
                        return;
                    }
                });

                /**
                 * If the location already exists, then we keep it -> this will replace the asset
                 */

                if (match) patchedDestinations = artboard.destinations;

                if (!match) {
                    /**
                     * In theory, we could just push the new destination
                     * This would result in *multiple* destinations.
                     * The asset would be uploaded to one or more folders.
                     *
                     * NOTE: We don’t support multiple destinations right now.
                     * There are a few open UX questions to be answered and
                     * it makes everything more complex. The data structure supports it
                     * (destinations is an Array) and the upload also works.
                     * The grouping doesn’t work correctly, as the asset will be
                     * displayed mutiple times per group.
                     */
                    // patchedDestinations.push(...artboard.destinations);
                }
            }

            return {
                ...artboard,
                destinations: patchedDestinations,
            };
        });
    }
}

export default new Artboard();
