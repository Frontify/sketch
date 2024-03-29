import target from './target';
import fetch from '../helpers/fetch';
import sketch from './sketch';
import { isWebviewPresent, sendToWebview } from 'sketch-module-web-view/remote';

let API = require('sketch');
let sketchDom = require('sketch/dom');

class Color {
    getColors(project) {
        // load remote assets status
        return fetch('/v1/color/library/' + project);
    }

    applyColor(color) {
        let selection = sketch.getSelection();
        let loop = selection.objectEnumerator();
        let item = null;

        while ((item = loop.nextObject())) {
            if (item.class() == MSLayerGroup) {
                let layers = item.layers();
                layers.forEach(
                    function (layer) {
                        this.applyColorToLayer(layer, color);
                    }.bind(this)
                );
            } else {
                this.applyColorToLayer(item, color);
            }
        }

        let doc = sketch.getDocument();
        if (doc) {
            doc.reloadInspector();
        }
    }

    addDocumentColors(colors) {
        this.addColorsToDocumentScope(colors);
    }

    replaceDocumentColors(colors) {
        this.addColorsToDocumentScope(colors, true);
    }

    addColorsToDocumentScope(colors, replaceCurrentColors = false) {
        let selectedDocument = API.getSelectedDocument();

        if (selectedDocument) {
            if (replaceCurrentColors) {
                selectedDocument.swatches = [];
            }

            colors.forEach((color) =>
                selectedDocument.swatches.push(
                    API.Swatch.from({
                        name: color.name,
                        color: color.css_value_hex,
                    })
                )
            );
        }
    }

    addGlobalColors(colors) {
        colors.forEach((color) =>
            sketchDom.globalAssets.colors.push({
                name: color.name,
                color: color.css_value_hex,
            })
        );
    }

    replaceGlobalColors(colors) {
        sketchDom.globalAssets.colors = [];
        this.addGlobalColors(colors);
    }

    convertColor(color, type) {
        if (type === 'MSColor') {
            // Color for e.g. typostyles
            return MSColor.colorWithRed_green_blue_alpha(
                color.r / 255,
                color.g / 255,
                color.b / 255,
                (color.alpha || color.a) / 255
            );
        } else {
            // Asset for document and global colors
            return MSColorAsset.alloc().initWithAsset_name(
                MSColor.colorWithRed_green_blue_alpha(
                    color.r / 255,
                    color.g / 255,
                    color.b / 255,
                    (color.alpha || color.a) / 255
                ),
                color.name
            );
        }
    }

    applyColorToLayer(layer, color) {
        let mscolor = MSColor.colorWithRed_green_blue_alpha(color.r / 255, color.g / 255, color.b / 255, color.a / 255);
        let clazz = layer.class();

        if (clazz == MSTextLayer) {
            layer.setTextColor(mscolor);
        } else if (
            clazz == MSRectangleShape ||
            clazz == MSOvalShape ||
            clazz == MSTriangleShape ||
            clazz == MSStarShape ||
            clazz == MSPolygonShape ||
            clazz == MSShapeGroup
        ) {
            let fills = layer.style().fills();
            if (fills.count() <= 0) {
                fills.addNewStylePart();
            }
            let fill = fills.firstObject();
            fill.isEnabled = true;
            fill.setFillType(0);
            fill.setColor(mscolor);
        }
    }

    showColors() {
        target.getAssetSourcesForType('colors').then(
            function (assetSources) {
                if (assetSources && assetSources.selected) {
                    this.getColors(assetSources.selected.id).then(
                        function (data) {
                            if (isWebviewPresent('frontifymain')) {
                                data.project = assetSources.selected;
                                sendToWebview('frontifymain', 'showAssetSources(' + JSON.stringify(assetSources) + ')');
                                sendToWebview('frontifymain', 'showColors(' + JSON.stringify(data) + ')');
                            }
                        }.bind(this)
                    );
                }
            }.bind(this)
        );
    }
}

export default new Color();
