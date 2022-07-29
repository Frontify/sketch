import fetch from '../helpers/fetch';
import sketch from './sketch';

let sketch3 = require('sketch');

import { Document, Image, Style } from 'sketch/dom';

class Asset {
    constructor() {}

    searchSketchAssetsInProject(projectID) {
        let url = `v1/assets/status/${projectID}?ext=sketch&depth=999`;

        return fetch(url).then((data) => {
            return data;
        });
    }

    import(assetId) {
        const url = '/v1/inspect/import/' + assetId;
        return fetch(url, { method: 'GET' });
    }

    resize(width, height) {
        let currentDocument = Document.fromNative(sketch.getDocument());
        if (!currentDocument) return;
        currentDocument.selectedLayers.forEach((layer) => {
            let originalWidth = layer.frame.width;
            let originalHeight = layer.frame.height;
            let originalRatio = originalWidth / originalHeight;

            // check whether layer is a shape
            if (layer.type != 'Artboard' && layer.style) {
                layer.frame.width = width;
                if (height) {
                    layer.frame.height = height;
                } else {
                    layer.frame.height = width / originalRatio;
                }
                layer.frame.x = layer.frame.x - layer.frame.width / 2 + originalWidth / 2;
                layer.frame.y = layer.frame.y - layer.frame.height / 2 + originalHeight / 2;
            }
        });
    }

    applyImage(data, desiredWidth) {
        return new Promise((resolve, reject) => {
            if (data.previewUrl && data.extension) {
                let url = data.previewUrl;

                if (desiredWidth) {
                    url += `?width=${desiredWidth || null}`;
                }
                let ext = data.extension;

                let currentDocument = Document.fromNative(sketch.getDocument());
                if (!currentDocument) reject();

                if (ext !== 'svg') {
                    let image = NSImage.alloc().initWithContentsOfURL(NSURL.URLWithString(url));
                    let imageLayer = new Image({ image: image });
                    let imageSize = image.size();

                    if (imageLayer && imageLayer.image) {
                        imageLayer.frame.width = imageSize.width;
                        imageLayer.frame.height = imageSize.height;

                        let imageData = imageLayer.image;

                        let applied = false;

                        currentDocument.selectedLayers.forEach((layer) => {
                            // check whether layer is a shape
                            if (layer.type != 'Artboard' && layer.style) {
                                applied = true;
                                layer.style.fills = [
                                    {
                                        fill: Style.FillType.Pattern,
                                        pattern: {
                                            patternType: Style.PatternFillType.Fill,
                                            image: imageData,
                                        },
                                    },
                                ];
                            }
                        });

                        if (!applied) {
                            // no appropriate layer has been selected -> add to document
                            let parent = null;

                            currentDocument.selectedLayers.forEach((layer) => {
                                if (layer.type == 'Artboard') {
                                    parent = layer;
                                }
                            });

                            if (parent) {
                                imageLayer.parent = parent;

                                let ratio = imageSize.height / imageSize.width;

                                imageLayer.frame.width = parent.frame.width;
                                imageLayer.frame.height = ratio * parent.frame.width;
                            } else {
                                imageLayer.parent = currentDocument.selectedPage;
                            }

                            imageLayer.selected = true;
                            currentDocument.centerOnLayer(imageLayer);
                            // currentDocument.sketchObject.eventHandlerManager().currentHandler().zoomToSelection();
                        }

                        resolve();
                    }
                } else {
                    this.applySVG(url, data.title, currentDocument)
                        .then(() => {
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                }
            }
        });
    }

    applySVG(url, title, document) {
        console.log('applySVG');
        return new Promise((resolve, reject) => {
            fetch(url, { cdn: true })
                .then((blob) => {
                    // SVG as Base 64 String
                    let svgString = NSString.stringWithString(blob);

                    // Import the SVG
                    const group = sketch3.createLayerFromData(svgString, 'svg');

                    // Change the name of the group
                    group.name = title || 'SVG';

                    // Here we’ll figure out, to which existing layer we’ll add the imported SVG to:
                    let parent = document.selectedPage;

                    // If the current selection contains an Artboard, we’ll use that…
                    document.selectedLayers.forEach((selectedLayer) => {
                        if (selectedLayer.type == 'Artboard') {
                            parent = selectedLayer;
                        }
                    });

                    /**
                     * In this case, a single layer is selected.
                     * The selection will be replaced by the SVG.
                     * This is useful with icons. When icons have the same size
                     * the replacement can be used to "swap" icons.
                     */

                    if (parent.type != 'Artboard' && document.selectedLayers.length) {
                        // replace selection
                        var selection = document.selectedLayers.layers[0];
                        parent = selection;

                        // Position the SVG at the frame of the selection
                        group.frame.x = selection.frame.x;
                        group.frame.y = selection.frame.y;

                        // Assign new parent
                        group.parent = selection.parent;
                        group.index = selection.index;

                        // Remove the selected layer
                        selection.remove();
                    } else {
                        // Add the SVG to the parent
                        group.parent = parent;

                        // Deselect the parent
                        parent.selected = false;
                    }

                    // Select the group
                    group.selected = true;
                    document.centerOnLayer(group);
                    // currentDocument.sketchObject.eventHandlerManager().currentHandler().zoomToSelection();

                    // Todo: Figure out why we used this?
                    // Problem: If we call this, the Promise won’t resolve afterwards
                    // app.refreshCurrentDocument();

                    resolve();
                })
                .catch((e) => {
                    console.error('failed to fetch svg', e);
                    reject(e);
                });
        });
    }
}

export default new Asset();
