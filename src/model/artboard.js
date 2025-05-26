import fetch from '../helpers/fetch';
import shaFile from '../helpers/shaFile';
import readJSON from '../helpers/readJSON';
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

    log(message, data) {
        console.log('[FRONTIFY] ' + message);
        if (data) {
            try {
                console.log(JSON.stringify(data, null, 2));
            } catch (e) {
                console.log('Could not stringify data: ' + e.message);
                console.log(data);
            }
        }

        if (isWebviewPresent('frontifymain')) {
            sendToWebview('frontifymain', 'console.log(' + JSON.stringify('[FRONTIFY] ' + message) + ')');

            if (data) {
                try {
                    sendToWebview('frontifymain', 'console.log(' + JSON.stringify(JSON.stringify(data, null, 2)) + ')');
                } catch (e) {
                    sendToWebview('frontifymain', 'console.log("Data too complex to log in UI")');
                }
            }
        }
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
                    ')',
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
                            encodeURIComponent(target.set.path),
                    );
                }

                return remoteStatus.then(
                    function (result) {
                        let assets = result.assets;
                        this.remoteAssets = result.assets;

                        // get artboards or frames
                        let artboards = [];
                        let framesFound = false;

                        try {
                            // Use the DOM API to find frames in Sketch 2025.1
                            const doc = DOM.getSelectedDocument();
                            if (doc) {
                                const page = doc.selectedPage;

                                if (page) {
                                    this.log('Current page: ' + page.name);
                                    const layers = page.layers;

                                    // Filter for artboards and frames
                                    const frames = layers.filter((layer) => {
                                        return (
                                            layer.type === 'Artboard' ||
                                            layer.type === 'Frame' ||
                                            layer.type === 'SymbolMaster'
                                        );
                                    });

                                    this.log(`Found ${frames.length} frames/artboards using DOM API`);

                                    if (frames.length > 0) {
                                        framesFound = true;

                                        // Create compatible artboard objects
                                        for (let i = 0; i < frames.length; i++) {
                                            const frame = frames[i];
                                            const nativeObj = frame.sketchObject;

                                            // Get ID using the native objectID method to maintain same format
                                            const objectId =
                                                nativeObj && nativeObj.objectID ? nativeObj.objectID() : frame.id;

                                            this.log(
                                                `Frame: ${frame.name}, DOM id: ${frame.id}, objectID: ${objectId}`,
                                            );

                                            artboards.push({
                                                id: null,
                                                id_external: '' + objectId, // Use native ID format
                                                name: '' + frame.name.replace(/\s*\/\s*/g, '/'),
                                                ext: 'png',
                                                sha: null,
                                                state: 'new',
                                                target: '',
                                                modified: null,
                                                modifier_name: null,
                                                modified_localized_ago: null,
                                                // Add the DOM object for easy reference
                                                _domRef: frame,
                                            });
                                        }
                                    }
                                }
                            }
                        } catch (e) {
                            this.log('Error getting frames with DOM API: ' + e.message);
                        }

                        // Only use old method as fallback if no frames were found
                        if (!framesFound) {
                            this.log('No frames found with DOM API, trying old method');
                            try {
                                let doc = sketch.getDocument();
                                let mspage;

                                if (doc.currentPage && typeof doc.currentPage === 'function') {
                                    mspage = doc.currentPage();

                                    let msartboards = [];
                                    if (mspage.artboards && typeof mspage.artboards === 'function') {
                                        msartboards = mspage.artboards();
                                    }

                                    for (let i = 0; i < msartboards.length; i++) {
                                        let msartboard = msartboards[i];

                                        const objectId = msartboard.objectID();
                                        this.log(`Artboard: ${msartboard.name()}, objectID: ${objectId}`);

                                        artboards.push({
                                            id: null,
                                            id_external: '' + objectId,
                                            name: '' + msartboard.name().replace(/\s*\/\s*/g, '/'),
                                            ext: 'png',
                                            sha: null,
                                            state: 'new',
                                            target: '',
                                            modified: null,
                                            modifier_name: null,
                                            modified_localized_ago: null,
                                            // Add native reference
                                            _nativeRef: msartboard,
                                        });
                                    }
                                } else {
                                    this.log('currentPage method not available');
                                }
                            } catch (fallbackError) {
                                this.log('Fallback also failed: ' + fallbackError.message);
                            }
                        }

                        this.log('Found ' + artboards.length + ' total artboards/frames');

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

                                    if (path + asset.filename == artboard.name.trim() + '.' + asset.ext) {
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
                        try {
                            const doc = DOM.getSelectedDocument();
                            if (doc && doc.selectedLayers) {
                                doc.selectedLayers.forEach(function (layer) {
                                    if (
                                        layer.type === 'Artboard' ||
                                        layer.type === 'Frame' ||
                                        layer.type === 'SymbolMaster'
                                    ) {
                                        // Get the native object ID
                                        const nativeObj = layer.sketchObject;
                                        const objectId =
                                            nativeObj && nativeObj.objectID ? nativeObj.objectID() : layer.id;
                                        selectedArtboards.push(objectId);
                                    }
                                });
                            }
                        } catch (e) {
                            this.log('Error getting selections: ' + e.message);
                        }

                        for (let i = 0; i < artboards.length; i++) {
                            let artboard = artboards[i];
                            if (selectedArtboards.indexOf(artboard.id_external) > -1) {
                                artboard.selected = true;
                            }
                        }

                        let data = {
                            artboards: artboards.reverse(),
                            target: target,
                        };

                        return data;
                    }.bind(this),
                );
            }.bind(this),
        );
    }

    exportArtboard(artboard, doc) {
        return new Promise(
            function (resolve) {
                this.log('Exporting artboard/frame: ' + artboard.name + ' (ID: ' + artboard.id_external + ')');
                let files = [];

                // Ensure export path exists
                try {
                    const exportPath = filemanager.getExportPath();
                    this.log('Using export path: ' + exportPath);

                    // Create the directory if it doesn't exist
                    const fileManager = NSFileManager.defaultManager();
                    if (!fileManager.fileExistsAtPath(exportPath)) {
                        this.log("Export directory doesn't exist, creating it");
                        try {
                            fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(
                                exportPath,
                                true,
                                nil,
                                nil,
                            );
                            this.log('Created export directory');
                        } catch (e) {
                            this.log('ERROR: Failed to create export directory: ' + e.message);
                            throw e;
                        }
                    }
                } catch (e) {
                    this.log('Error checking/creating export path: ' + e.message);
                }

                // 1. Get the layer object
                let msartboard = null;
                let jsartboard = null;

                try {
                    // First check if we have a DOM reference stored
                    if (artboard._domRef) {
                        jsartboard = artboard._domRef;
                        msartboard = jsartboard.sketchObject;
                        this.log('Using stored DOM reference for export');
                    }
                    // Then check for native reference
                    else if (artboard._nativeRef) {
                        msartboard = artboard._nativeRef;
                        this.log('Using stored native reference for export');
                    }
                    // If no stored references, try finding it
                    else {
                        // Try finding with native predicate
                        let predicate = NSPredicate.predicateWithFormat('objectID == %@', artboard.id_external);

                        try {
                            msartboard = sketch.findFirstLayer(predicate, nil, MSFrameLayer, doc);
                        } catch (e) {}

                        if (!msartboard) {
                            try {
                                msartboard = sketch.findFirstLayer(predicate, nil, MSFrame, doc);
                            } catch (e) {}
                        }

                        if (!msartboard) {
                            try {
                                msartboard = sketch.findFirstLayer(predicate, nil, MSArtboardGroup, doc);
                            } catch (e) {}
                        }

                        // If all native methods fail, try DOM API
                        if (!msartboard) {
                            const domDoc = DOM.getSelectedDocument();
                            jsartboard = domDoc.getLayerWithID(artboard.id_external);

                            if (jsartboard) {
                                msartboard = jsartboard.sketchObject;
                            }
                        }
                    }
                } catch (e) {
                    this.log('Error finding artboard/frame: ' + e.message);
                }

                if (!msartboard) {
                    this.log('ERROR: Could not find artboard/frame: ' + artboard.name);
                    throw new Error('Could not find artboard/frame: ' + artboard.name);
                }

                // 2. Export as PNG using direct method and multiple fallbacks
                try {
                    this.log('Exporting PNG');
                    let path = filemanager.getExportPath() + artboard.name.trim() + '.png';

                    // Try the most direct method first - get PNG data directly
                    try {
                        // Check if we can get PNG representation directly
                        const pngData = msartboard.copyAsImageDataWithOptions
                            ? msartboard.copyAsImageDataWithOptions(nil)
                            : null;

                        if (pngData && pngData.length() > 0) {
                            this.log('Got PNG data directly, size: ' + pngData.length() + ' bytes');

                            // Save PNG data to disk
                            const fileManager = NSFileManager.defaultManager();
                            const success = pngData.writeToFile_atomically(path, true);

                            if (success) {
                                this.log('PNG saved successfully at: ' + path);
                            } else {
                                throw new Error('Failed to write PNG data to file');
                            }
                        } else {
                            throw new Error('Failed to get PNG data from artboard');
                        }
                    } catch (directError) {
                        this.log('Direct PNG export failed: ' + directError.message + ', trying alternative methods');

                        // Try API.export next (which works in Sketch 2025.1)
                        try {
                            this.log('Trying API.export');

                            API.export(msartboard, {
                                scales: [this.pixelRatio],
                                formats: 'png',
                                output: path,
                                overwriting: true,
                            });

                            this.log('API.export completed');
                        } catch (apiExportError) {
                            this.log('API.export failed: ' + apiExportError.message);

                            // Try MSExportRequest as final fallback
                            this.log('Trying MSExportRequest');
                            let imageFormat = MSExportFormat.alloc().init();
                            imageFormat.setFileFormat('png');
                            imageFormat.setScale(this.pixelRatio); // @2x

                            let exportRequest =
                                MSExportRequest.exportRequestsFromExportableLayer_exportFormats_useIDForName(
                                    msartboard,
                                    [imageFormat],
                                    true,
                                ).firstObject();

                            doc.saveArtboardOrSlice_toFile(exportRequest, path);
                            this.log('MSExportRequest succeeded');
                        }
                    }

                    // Verify the file was created
                    const fileManager = NSFileManager.defaultManager();
                    if (fileManager.fileExistsAtPath(path)) {
                        const fileAttributes = fileManager.attributesOfItemAtPath_error(path, nil);
                        if (fileAttributes) {
                            const fileSize = Number(fileAttributes.fileSize());
                            this.log('Exported PNG exists with size: ' + fileSize + ' bytes');

                            if (fileSize === 0) {
                                throw new Error('PNG file was created but is empty (0 bytes)');
                            }
                        } else {
                            this.log('Warning: Could not get file attributes for size verification');
                        }
                    } else {
                        throw new Error("PNG export failed - file doesn't exist at path: " + path);
                    }

                    files.push({
                        name: artboard.name,
                        ext: 'png',
                        id_external: artboard.id_external,
                        id: artboard.id,
                        sha: artboard.sha,
                        path: path,
                        type: 'artboard',
                    });
                } catch (e) {
                    this.log('All PNG export methods failed: ' + e.message);
                    throw e;
                }

                // 3. Export as JSON
                try {
                    // Make sure we have a JS artboard object
                    if (!jsartboard) {
                        try {
                            if (DOM.Frame && DOM.Frame.fromNative) {
                                jsartboard = DOM.Frame.fromNative(msartboard);
                            } else {
                                jsartboard = DOM.Artboard.fromNative(msartboard);
                            }
                        } catch (e) {
                            this.log('Error converting to DOM object: ' + e.message);
                            throw e;
                        }
                    }

                    // Export the artboard/frame data
                    let artboardExport = DOM.export(jsartboard, {
                        formats: 'json',
                        output: false,
                    });

                    // Export formats
                    try {
                        files = files.concat(this.exportFormats(doc, jsartboard));
                    } catch (e) {
                        this.log('Error exporting formats: ' + e.message);
                        // Continue without additional formats
                    }

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

                    // Verify the JSON file exists
                    const jsonPath = exportPath + exportName + '.json';
                    const fileManager = NSFileManager.defaultManager();
                    if (fileManager.fileExistsAtPath(jsonPath)) {
                        const fileAttributes = fileManager.attributesOfItemAtPath_error(jsonPath, nil);
                        if (fileAttributes) {
                            const fileSize = Number(fileAttributes.fileSize());
                            this.log('Exported JSON exists with size: ' + fileSize + ' bytes');
                        }
                    } else {
                        this.log('Warning: JSON file not found at path: ' + jsonPath);
                    }

                    files.push({
                        name: exportName,
                        ext: 'json',
                        id_external: artboard.id_external,
                        id: artboard.id,
                        path: jsonPath,
                        type: 'attachment',
                    });

                    this.log('JSON exported successfully');
                } catch (e) {
                    this.log('Error exporting JSON: ' + e.message);
                    throw e;
                }

                resolve(files);
            }.bind(this),
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
        } else {
            settings = layer['userInfo']['com.frontify.sketch'];
        }

        settings[key] = data;
    }

    optimizeLayers(layers) {
        if (!layers || !Array.isArray(layers)) {
            return [];
        }

        const optimize = (layer) => {
            if (!layer) return layer;

            layer = this.layerRemoveImageFills(layer);

            if (layer._class === 'group' || layer._class === 'shapeGroup') {
                if (layer.layers && Array.isArray(layer.layers)) {
                    layer.layers = layer.layers.map(optimize);
                }
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
     *  Replaces base64 image with a lightweight 1x1 px placeholder, because we don't need that extra asset
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
        if (!layers || !Array.isArray(layers)) {
            return [];
        }

        const resolve = (layer) => {
            if (!layer) return layer;

            if (layer._class === 'symbolInstance') {
                try {
                    return this.getDetachedGroupByExportedSymbolLayer(layer);
                } catch (e) {
                    this.log('Error resolving symbol: ' + e.message);
                    return layer;
                }
            }

            if (layer._class === 'group' || layer._class === 'shapeGroup') {
                if (layer.layers && Array.isArray(layer.layers)) {
                    layer.layers = layer.layers.map(resolve);
                }
            }

            return layer;
        };

        return layers.map(resolve);
    }

    /**
     * Accepts an exported symbol layer and returns a detached version in export json format
     * Nested symbols are detached deeply
     * @param exportedLayer (a layer after export to json format)
     */
    getDetachedGroupByExportedSymbolLayer(exportedLayer) {
        try {
            const document = DOM.getSelectedDocument();
            const layerId = exportedLayer.do_objectID;
            const originalSymbolInstance = document.getLayerWithID(layerId);

            if (!originalSymbolInstance) {
                this.log('Symbol instance not found with ID: ' + layerId);
                return exportedLayer;
            }

            // Keep name and rename duplicate to recognize it if something is broken during export
            const layerName = originalSymbolInstance.name;
            const duplicatedSymbolInstance = originalSymbolInstance.duplicate();
            duplicatedSymbolInstance.name = '[export copy] ' + layerName;

            const detachedGroup = this.recursivelyDetachSymbols(duplicatedSymbolInstance);

            if (!detachedGroup) {
                this.log('Failed to detach symbol, returning original layer');
                return exportedLayer;
            }

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
            // because we want to keep that id to match exportables (attachments)
            detachedGroupExport.do_objectID = layerId;

            return detachedGroupExport;
        } catch (e) {
            this.log('Error in getDetachedGroupByExportedSymbolLayer: ' + e.message);
            return exportedLayer;
        }
    }

    layerIsDetachableSymbolInstance(layer) {
        // SymbolInstance with empty layer.symbolId is used if symbol overrides
        // are defined and override property is set to 'no symbol' (Sketch 88)
        return layer && layer.type === 'SymbolInstance' && !!layer.symbolId;
    }

    /**
     * The recursion is done manually, so we can add meta to separated symbols before we detach them.
     * In this way, we can later determine that it was a symbol.
     * @param layer
     * @returns {void | *}
     */
    recursivelyDetachSymbols(layer) {
        if (!layer) {
            return null;
        } else if (layer.type === 'Group') {
            if (layer.layers && Array.isArray(layer.layers)) {
                layer.layers.forEach((childLayer) => {
                    this.recursivelyDetachSymbols(childLayer);
                });
            }

            return layer;
        } else if (!this.layerIsDetachableSymbolInstance(layer)) {
            return layer;
        }

        try {
            const document = DOM.getSelectedDocument();
            const originalSymbolMaster = document.getSymbolMasterWithID(layer.symbolId);

            if (!originalSymbolMaster) {
                this.log('Symbol Master with ID ' + layer.symbolId + ' not found');
                return layer;
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
            try {
                Settings.setLayerSettingForKey(layer, 'meta', meta);
            } catch (e) {
                this.log('Error setting meta: ' + e.message);
            }

            let detachedlayer = null;
            try {
                detachedlayer = layer.detach({ recursively: false });
            } catch (e) {
                this.log('Detach failed: ' + e.message);
            }

            /* fallback for undetachable symbols (e.g. symbols without layers) */
            if (!detachedlayer) {
                try {
                    detachedlayer = this.getFallbackLayerFromUndetachableSymbol(layer);
                    Settings.setLayerSettingForKey(detachedlayer, 'meta', meta);

                    /* remove remaining duplicate because we return an additionally created layer */
                    layer.remove();
                } catch (e) {
                    this.log('Fallback detach failed: ' + e.message);
                    return layer;
                }
            }

            /* if the symbol was detachable, the detached layer is a now a group, so do detaching for its layers again */
            if (detachedlayer && detachedlayer.type === 'Group') {
                this.recursivelyDetachSymbols(detachedlayer);
            }

            return detachedlayer;
        } catch (e) {
            this.log('Error in recursivelyDetachSymbols: ' + e.message);
            return layer;
        }
    }

    getFallbackLayerFromUndetachableSymbol(symbolLayer) {
        if (!symbolLayer) {
            throw new Error('Symbol layer is null or undefined');
        }

        const propertiesBlacklist = ['id', 'type', 'symbolId', 'overrides'];
        const fallbackLayerProperties = {};

        for (const property in symbolLayer) {
            if (propertiesBlacklist.includes(property)) {
                continue;
            }

            fallbackLayerProperties[property] = symbolLayer[property];
        }

        const fallbackLayer = new DOM.Group(fallbackLayerProperties);

        return fallbackLayer;
    }

    exportFormats(doc, layer) {
        let files = [];

        if (!layer.exportFormats || layer.exportFormats.length === 0) {
            return files;
        }

        try {
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
                const path = filemanager.getExportPath() + timeStamp + '-' + name.trim() + '.' + format.fileFormat;

                try {
                    // Try API.export first
                    if (API.export) {
                        const scale = this.getLayerScaleNumberFromSizeString(format.size, layer.frame);
                        API.export(layer.sketchObject, {
                            scales: [scale],
                            formats: format.fileFormat,
                            output: path,
                            overwriting: true,
                        });
                        this.log(`Format exported with API.export: ${name}.${format.fileFormat}`);
                    } else {
                        // Use traditional MSExportRequest as fallback
                        const layerSizeAsScaleNumber = this.getLayerScaleNumberFromSizeString(format.size, layer.frame);
                        const layerFormat = MSExportFormat.alloc().init();

                        layerFormat.setFileFormat(format.fileFormat);
                        layerFormat.setScale(layerSizeAsScaleNumber);

                        const exportRequest =
                            MSExportRequest.exportRequestsFromExportableLayer_exportFormats_useIDForName(
                                layer.sketchObject,
                                [layerFormat],
                                true,
                            ).firstObject();
                        doc.saveArtboardOrSlice_toFile(exportRequest, path);
                        this.log(`Format exported with MSExportRequest: ${name}.${format.fileFormat}`);
                    }

                    files.push({
                        name: name.trim(),
                        ext: format.fileFormat,
                        id_external: layer.id,
                        id: layer.id,
                        path: path,
                        type: 'attachment',
                        pixel_ratio: format.size,
                    });
                } catch (e) {
                    this.log(`Error exporting format ${name}.${format.fileFormat}: ${e.message}`);
                }
            });

            if (layer.layers) {
                layer.layers.forEach((childLayer) => {
                    try {
                        const childFiles = this.exportFormats(doc, childLayer);
                        files = files.concat(childFiles);
                    } catch (e) {
                        this.log(`Error exporting formats for child layer ${childLayer.name}: ${e.message}`);
                    }
                });
            }
        } catch (e) {
            this.log('Error in exportFormats: ' + e.message);
        }

        return files;
    }

    uploadArtboards(artboards) {
        // sequence artboard export and upload
        this.uploadInProgress = true;
        this.log('Starting upload of ' + artboards.length + ' artboards');

        return this.getArtboards()
            .then(
                function (data) {
                    let target = data.target;
                    this.log('Target info:', target);

                    let status = readJSON('artboards-' + target.project.id) || { artboards: {} };

                    // get the current state of the given artboards
                    artboards = artboards
                        .map(function (artboard) {
                            return data.artboards.find(function (remoteArtboard) {
                                return remoteArtboard.id_external == artboard.id_external;
                            });
                        })
                        .filter((item) => item); // Remove undefined items

                    if (artboards.length === 0) {
                        this.log('No valid artboards found for upload');
                        this.uploadInProgress = false;
                        return Promise.resolve();
                    }

                    this.log('Found ' + artboards.length + ' valid artboards for upload');

                    let doc = null;

                    // Try multiple ways to get the document
                    try {
                        // Method 1: Use sketch API helper
                        doc = sketch.getDocument();
                    } catch (e) {
                        this.logUpload('Error with sketch.getDocument(): ' + e.message);
                    }

                    if (!doc) {
                        try {
                            // Method 2: Use DOM API
                            doc = DOM.getSelectedDocument();

                            // If DOM method works but returns a DOM object, get its native counterpart
                            if (doc && !doc.currentPage && doc.sketchObject) {
                                doc = doc.sketchObject;
                            }
                        } catch (e) {
                            this.logUpload('Error with DOM.getSelectedDocument(): ' + e.message);
                        }
                    }

                    // Final check
                    if (!doc) {
                        this.logUpload('ERROR: No document found after multiple attempts');
                        throw new Error('No document found');
                    }

                    return artboards.reduce(
                        function (sequence, artboard) {
                            return sequence
                                .then(
                                    function () {
                                        this.log('Processing artboard: ' + artboard.name);
                                        return this.exportArtboard(artboard, doc);
                                    }.bind(this),
                                )
                                .then(
                                    function (files) {
                                        this.log('Export completed. Files to upload:', files.length);

                                        if (!files || files.length === 0) {
                                            this.log('ERROR: No files exported for ' + artboard.name);
                                            return Promise.resolve();
                                        }

                                        var artboardProgress = NSProgress.progressWithTotalUnitCount(
                                            10 * files.length + 20,
                                        );
                                        artboardProgress.setCompletedUnitCount(0);

                                        var polling = setInterval(
                                            function () {
                                                this.updateProgress(artboard, artboardProgress);
                                            }.bind(this),
                                            100,
                                        );

                                        let artboardChanged = false;
                                        return files
                                            .reduce(
                                                function (uploadsequence, file) {
                                                    return uploadsequence
                                                        .then(
                                                            function (assetId) {
                                                                try {
                                                                    this.log(
                                                                        `Processing file: ${file.name}.${file.ext}`,
                                                                    );

                                                                    // Make sure file path exists
                                                                    if (!file.path) {
                                                                        this.log(
                                                                            'No valid file path for: ' + file.name,
                                                                        );
                                                                        return Promise.resolve(assetId);
                                                                    }

                                                                    // Check if file exists and has content
                                                                    const fileManager = NSFileManager.defaultManager();

                                                                    if (!fileManager.fileExistsAtPath(file.path)) {
                                                                        this.log("File doesn't exist: " + file.path);
                                                                        return Promise.resolve(assetId);
                                                                    }

                                                                    const fileAttrs =
                                                                        fileManager.attributesOfItemAtPath_error(
                                                                            file.path,
                                                                            nil,
                                                                        );
                                                                    const fileSize = fileAttrs
                                                                        ? Number(fileAttrs.fileSize())
                                                                        : 0;

                                                                    if (fileSize <= 0) {
                                                                        this.log(
                                                                            'File is empty (0 bytes): ' + file.path,
                                                                        );
                                                                        return Promise.resolve(assetId);
                                                                    }

                                                                    this.log(
                                                                        'File ready for upload, size: ' +
                                                                            fileSize +
                                                                            ' bytes',
                                                                    );

                                                                    // Calculate SHA
                                                                    let artboardSHA;
                                                                    try {
                                                                        artboardSHA = '' + shaFile(file.path);
                                                                    } catch (shaError) {
                                                                        this.log(
                                                                            'Error calculating SHA: ' +
                                                                                shaError.message,
                                                                        );
                                                                        artboardSHA = 'updated-' + Date.now();
                                                                    }

                                                                    if (file.type === 'artboard') {
                                                                        let localSHA =
                                                                            status.artboards[file.id] || null;
                                                                        this.log(
                                                                            'Artboard SHA check - local: ' +
                                                                                localSHA +
                                                                                ', new: ' +
                                                                                artboardSHA,
                                                                        );

                                                                        if (localSHA != artboardSHA) {
                                                                            artboardChanged = true;
                                                                            this.log('Artboard changed, uploading');

                                                                            // Prepare upload parameters
                                                                            const uploadParams = {
                                                                                path: file.path,
                                                                                filename:
                                                                                    file.name.trim() + '.' + file.ext,
                                                                                name: file.name,
                                                                                id_external: file.id_external,
                                                                                pixel_ratio: this.pixelRatio,
                                                                                folder: target.set.path,
                                                                                project: target.project.id,
                                                                                type: file.type,
                                                                            };

                                                                            // Add ID only if it's valid
                                                                            if (file.id) {
                                                                                uploadParams.id = file.id;
                                                                            }

                                                                            this.log(
                                                                                'Uploading artboard with params:',
                                                                                uploadParams,
                                                                            );

                                                                            return filemanager
                                                                                .uploadFile(
                                                                                    uploadParams,
                                                                                    artboardProgress,
                                                                                )
                                                                                .then(
                                                                                    function (data) {
                                                                                        this.log(
                                                                                            'Upload successful:',
                                                                                            data,
                                                                                        );
                                                                                        filemanager.deleteFile(
                                                                                            file.path,
                                                                                        );
                                                                                        this.updateProgress(
                                                                                            artboard,
                                                                                            artboardProgress,
                                                                                        );

                                                                                        if (!data || !data.id) {
                                                                                            this.log(
                                                                                                'ERROR: Invalid response data:',
                                                                                                data,
                                                                                            );
                                                                                            return null;
                                                                                        }

                                                                                        filemanager.updateArtboardStatus(
                                                                                            target.project.id,
                                                                                            {
                                                                                                id: data.id,
                                                                                                sha: artboardSHA,
                                                                                            },
                                                                                        );

                                                                                        artboard.id = data.id;
                                                                                        artboard.nochanges = false;

                                                                                        return data.id;
                                                                                    }.bind(this),
                                                                                )
                                                                                .catch(
                                                                                    function (err) {
                                                                                        this.log(
                                                                                            'Artboard upload error:',
                                                                                            err.message,
                                                                                        );
                                                                                        if (file.path) {
                                                                                            filemanager.deleteFile(
                                                                                                file.path,
                                                                                            );
                                                                                        }
                                                                                        return Promise.resolve(null);
                                                                                    }.bind(this),
                                                                                );
                                                                        } else {
                                                                            this.log('Artboard unchanged');
                                                                            artboardChanged = false;
                                                                            artboardProgress.setCompletedUnitCount(
                                                                                artboardProgress.completedUnitCount() +
                                                                                    10,
                                                                            );
                                                                            this.updateProgress(
                                                                                artboard,
                                                                                artboardProgress,
                                                                            );
                                                                            filemanager.deleteFile(file.path);
                                                                            artboard.nochanges = true;
                                                                            return artboard.id;
                                                                        }
                                                                    } else if (file.type === 'attachment') {
                                                                        this.log('Processing attachment');
                                                                        let remoteStatus =
                                                                            this.getRemoteStatusForAttachment(
                                                                                artboard,
                                                                                file,
                                                                            );

                                                                        let attachmentSHA = '' + shaFile(file.path);
                                                                        // Create a valid key that doesn't rely on artboard.id if it's not available
                                                                        let key = artboard.id
                                                                            ? artboard.id + '-' + remoteStatus.filename
                                                                            : 'temp-' +
                                                                              file.id_external +
                                                                              '-' +
                                                                              remoteStatus.filename;

                                                                        let localSHA = status.artboards[key] || null;
                                                                        this.log(
                                                                            'Attachment SHA check - local: ' +
                                                                                localSHA +
                                                                                ', new: ' +
                                                                                attachmentSHA,
                                                                        );

                                                                        if (
                                                                            artboardChanged ||
                                                                            attachmentSHA != localSHA
                                                                        ) {
                                                                            this.log(
                                                                                'Attachment changed or artboard changed, uploading',
                                                                            );
                                                                            let filename;

                                                                            if (file.ext === 'json') {
                                                                                filename = file.name + '.' + file.ext;
                                                                            } else {
                                                                                // Generate unique filenames for exportables
                                                                                filename =
                                                                                    file.id_external +
                                                                                    '-' +
                                                                                    (file.pixel_ratio || '1x') +
                                                                                    '.' +
                                                                                    file.ext;
                                                                            }

                                                                            // Prepare upload parameters
                                                                            const uploadParams = {
                                                                                path: file.path,
                                                                                filename: filename,
                                                                                name: file.name,
                                                                                id_external: file.id_external,
                                                                                type: file.type,
                                                                            };

                                                                            // Only add asset_id if assetId is available
                                                                            if (assetId) {
                                                                                uploadParams.asset_id = assetId;
                                                                            } else {
                                                                                this.log(
                                                                                    'WARNING: No asset_id available for attachment',
                                                                                );
                                                                            }

                                                                            // Add pixel_ratio if available
                                                                            if (file.pixel_ratio) {
                                                                                uploadParams.pixel_ratio =
                                                                                    file.pixel_ratio;
                                                                            }

                                                                            this.log(
                                                                                'Uploading attachment with params:',
                                                                                uploadParams,
                                                                            );

                                                                            return filemanager
                                                                                .uploadFile(
                                                                                    uploadParams,
                                                                                    artboardProgress,
                                                                                )
                                                                                .then(
                                                                                    function (data) {
                                                                                        this.log(
                                                                                            'Attachment upload successful:',
                                                                                            data,
                                                                                        );
                                                                                        filemanager.deleteFile(
                                                                                            file.path,
                                                                                        );
                                                                                        this.updateProgress(
                                                                                            artboard,
                                                                                            artboardProgress,
                                                                                        );

                                                                                        filemanager.updateArtboardStatus(
                                                                                            target.project.id,
                                                                                            {
                                                                                                id: key,
                                                                                                sha: attachmentSHA,
                                                                                            },
                                                                                        );

                                                                                        return assetId;
                                                                                    }.bind(this),
                                                                                )
                                                                                .catch(
                                                                                    function (err) {
                                                                                        this.log(
                                                                                            'Attachment upload error:',
                                                                                            err.message,
                                                                                        );
                                                                                        if (file.path) {
                                                                                            filemanager.deleteFile(
                                                                                                file.path,
                                                                                            );
                                                                                        }
                                                                                        return Promise.resolve(assetId);
                                                                                    }.bind(this),
                                                                                );
                                                                        } else {
                                                                            this.log('Attachment unchanged');
                                                                            filemanager.deleteFile(file.path);
                                                                            artboardProgress.setCompletedUnitCount(
                                                                                artboardProgress.completedUnitCount() +
                                                                                    10,
                                                                            );
                                                                            this.updateProgress(
                                                                                artboard,
                                                                                artboardProgress,
                                                                            );
                                                                            return assetId;
                                                                        }
                                                                    }

                                                                    return assetId || null;
                                                                } catch (e) {
                                                                    this.log('Error processing file: ' + e.message);
                                                                    return Promise.resolve(assetId || null);
                                                                }
                                                            }.bind(this),
                                                        )
                                                        .catch(
                                                            function (err) {
                                                                this.log('Upload sequence error: ' + err.message);
                                                                return Promise.resolve(null);
                                                            }.bind(this),
                                                        );
                                                }.bind(this),
                                                Promise.resolve(),
                                            )
                                            .then(
                                                function (assetId) {
                                                    try {
                                                        if (assetId) {
                                                            // start import of asset
                                                            this.log('Importing asset with ID: ' + assetId);
                                                            asset.import(assetId); /* calls the import API */
                                                            this.log('Import successful for: ' + assetId);
                                                        } else {
                                                            this.log('WARNING: No asset ID to import');
                                                        }

                                                        artboardProgress.setCompletedUnitCount(
                                                            artboardProgress.completedUnitCount() + 20,
                                                        );
                                                        this.updateProgress(artboard, artboardProgress);
                                                    } catch (e) {
                                                        this.log('Error importing asset: ' + e.message);
                                                    }
                                                }.bind(this),
                                            )
                                            .then(function () {
                                                clearInterval(polling);
                                                if (isWebviewPresent('frontifymain')) {
                                                    sendToWebview(
                                                        'frontifymain',
                                                        'artboardUploaded(' + JSON.stringify(artboard) + ')',
                                                    );
                                                }
                                                return true;
                                            })
                                            .catch(
                                                function (err) {
                                                    clearInterval(polling);
                                                    this.log('Upload process error: ' + err.message);
                                                    if (isWebviewPresent('frontifymain')) {
                                                        sendToWebview(
                                                            'frontifymain',
                                                            'artboardUploadFailed(' + JSON.stringify(artboard) + ')',
                                                        );
                                                    }
                                                    return Promise.resolve();
                                                }.bind(this),
                                            );
                                    }.bind(this),
                                )
                                .catch(
                                    function (err) {
                                        this.log('Sequential processing error: ' + err.message);
                                        return Promise.resolve(); // Continue with next artboard
                                    }.bind(this),
                                );
                        }.bind(this),
                        Promise.resolve(),
                    );
                }.bind(this),
            )
            .then(
                function () {
                    this.log('Upload process completed');
                    this.uploadInProgress = false;
                }.bind(this),
            )
            .catch(
                function (err) {
                    this.log('Upload failed: ' + err.message, err.stack);
                    this.uploadInProgress = false;
                }.bind(this),
            );
    }

    getRemoteStatusForAttachment(artboard, file) {
        let status = null;

        if (artboard.attachments && artboard.attachments.length > 0) {
            artboard.attachments.forEach(function (attachment) {
                if (file.name == attachment.name && file.ext == attachment.ext) {
                    status = attachment;
                }
            });
        }

        if (!status) {
            status = {
                sha: null,
                filename: file.name + '.' + file.ext,
            };
        }

        return status;
    }

    showArtboards(skipRemote) {
        if (!this.uploadInProgress) {
            this.getArtboards(skipRemote)
                .then(
                    function (data) {
                        this.log('Found ' + data.artboards.length + ' artboards/frames');
                        if (isWebviewPresent('frontifymain')) {
                            sendToWebview('frontifymain', 'showArtboards(' + JSON.stringify(data) + ')');
                        }
                    }.bind(this),
                )
                .catch(
                    function (e) {
                        this.log('Error showing artboards: ' + e.message);
                    }.bind(this),
                );
        } else {
            this.log('Cannot show artboards - upload in progress');
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
