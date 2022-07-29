import target from './target';
import fetch from '../helpers/fetch';
import sketch from './sketch';
import { isWebviewPresent, sendToWebview } from 'sketch-module-web-view/remote';

let sketch3 = require('sketch');
let DOM = require('sketch/dom');

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
                let url = `${data.previewUrl}?width=${desiredWidth || 2000}`;
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
                    fetch(url, { cdn: true })
                        .then((blob) => {
                            // SVG as Base 64 String
                            let svgString = NSString.stringWithString(blob);

                            // Import the SVG
                            const group = sketch3.createLayerFromData(svgString, 'svg');

                            // Change the name of the group
                            group.name = data.title || 'SVG';

                            // Here we’ll figure out, to which existing layer we’ll add the imported SVG to:
                            let parent = null;

                            // If the current selection contains an Artboard, we’ll use that…
                            currentDocument.selectedLayers.forEach((selectedLayer) => {
                                if (!parent && selectedLayer.type == 'Artboard') {
                                    parent = selectedLayer;
                                }
                            });

                            // Otherwise, we’ll use the current page.
                            if (!parent) {
                                parent = currentDocument.selectedPage;
                            }

                            // Add the SVG to the parent
                            group.parent = parent;

                            // Deselect the parent
                            parent.selected = false;

                            // Select the group
                            group.selected = true;
                            currentDocument.centerOnLayer(group);
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
                }
            }
        });
    }
}

export default new Asset();
