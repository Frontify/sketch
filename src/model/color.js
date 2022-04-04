import target from './target';
import fetch from '../helpers/fetch';
import sketch from './sketch';
import { isWebviewPresent, sendToWebview } from 'sketch-module-web-view/remote';

let sketch3 = require('sketch');

console.log('color called');

class Color {
    constructor() {
        console.log('NEW COLOR CONSTRUCTOR');
    }
    getColors(project) {
        // load remote assets status
        return fetch('/v1/color/library/' + project);
    }

    applyColor(color) {
        // let selection = sketch.getSelection();

        let currentDocument = sketch3.getSelectedDocument();
        let selection = currentDocument.selectedLayers;

        selection.layers.forEach((layer) => {
            if (layer.layers) {
                let children = layer.layers();
                children.forEach((child) => {
                    this.applyColorToLayer(child, color);
                });
            } else {
                this.applyColorToLayer(layer, color);
            }
        });
    }

    addDocumentColors(colors) {
        if (this.getSketchVersion() >= '69') {
            this.addColorsToDocumentScope(colors);
        } else {
            this.addColorsToDocumentScopeLegacy(colors);
        }
    }

    replaceDocumentColors(colors) {
        if (this.getSketchVersion() >= '69') {
            this.addColorsToDocumentScope(colors, true);
        } else {
            this.addColorsToDocumentScopeLegacy(colors, true);
        }
    }

    addColorsToDocumentScope(colors, replaceCurrentColors = false) {
        let selectedDocument = sketch3.getSelectedDocument();

        if (selectedDocument) {
            if (replaceCurrentColors) {
                selectedDocument.swatches = [];
            }

            colors.forEach((color) => {
                selectedDocument.swatches.push(
                    sketch3.Swatch.from({
                        name: color.name,
                        color: color.css_value_hex,
                    })
                );
            });
        }
    }

    /**
     * @deprecated Should only be used in sketch version 68 and older! Use 'addColorsToDocumentScope' instead.
     */
    addColorsToDocumentScopeLegacy(colors, replaceCurrentColors = false) {
        let selectedDocument = sketch3.getSelectedDocument();

        if (selectedDocument) {
            if (replaceCurrentColors) {
                selectedDocument.colors = [];
            }

            this.convertColors(colors).forEach((convertedColor) => {
                selectedDocument.colors.push(convertedColor);
            });
        }
    }

    addGlobalColors(colors) {
        let app = NSApp.delegate();

        let assets = MSPersistentAssetCollection.sharedGlobalAssets();
        let mscolors = this.convertColors(colors);
        assets.addColorAssets(mscolors);

        app.refreshCurrentDocument();
    }

    replaceGlobalColors(colors) {
        let app = NSApp.delegate();

        let assets = app.globalAssets();
        let mscolors = this.convertColors(colors);
        assets.setColorAssets([]);
        assets.addColorAssets(mscolors);

        app.refreshCurrentDocument();
    }

    convertColors(colors) {
        let mscolors = [];
        colors.forEach(
            function (color) {
                mscolors.push(this.convertColor(color));
            }.bind(this)
        );

        return mscolors;
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
        console.log(layer.type);
        let layerType = layer.type;

        switch (layerType) {
            case 'Text':
                layer.style.fills = [
                    {
                        color: mscolor,
                        fillType: sketch3.Style.FillType.Color,
                    },
                ];
                break;
            case 'Shape':
            case 'ShapePath':
                // Todo: Make the fill replacement less destructive. For example, keep existing fills and only replace the first one.
                layer.style.fills = [
                    {
                        color: mscolor,
                        fillType: sketch3.Style.FillType.Color,
                    },
                ];
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

    getSketchVersion() {
        return sketch3.Settings.version.sketch;
    }
}

export default new Color();
