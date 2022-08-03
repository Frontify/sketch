// Sketch API
let sketch = require('sketch');

// Helpers
import fetch from '../helpers/fetch';

class Color {
    constructor() {}
    getColors(project) {
        // load remote assets status
        return fetch('/v1/color/library/' + project);
    }

    applyColor(color) {
        let currentDocument = sketch.getSelectedDocument();
        let selection = currentDocument.selectedLayers;

        selection.layers.forEach((layer) => {
            if (layer.layers) {
                let children = layer.layers;
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
        let selectedDocument = sketch.getSelectedDocument();

        if (selectedDocument) {
            if (replaceCurrentColors) {
                selectedDocument.swatches = [];
            }

            colors.forEach((color) => {
                selectedDocument.swatches.push(
                    sketch.Swatch.from({
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
        let selectedDocument = sketch.getSelectedDocument();

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

        // app.refreshCurrentDocument();
    }

    replaceGlobalColors(colors) {
        let app = NSApp.delegate();

        let assets = app.globalAssets();
        let mscolors = this.convertColors(colors);
        assets.setColorAssets([]);
        assets.addColorAssets(mscolors);

        // app.refreshCurrentDocument();
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

        let layerType = layer.type;

        switch (layerType) {
            case 'Text':
                layer.style.fills = [
                    {
                        color: mscolor,
                        fillType: sketch.Style.FillType.Color,
                    },
                ];
                break;
            case 'Shape':
            case 'ShapePath':
                // Todo: Make the fill replacement less destructive. For example, keep existing fills and only replace the first one.
                layer.style.fills = [
                    {
                        color: mscolor,
                        fillType: sketch.Style.FillType.Color,
                    },
                ];
        }
    }

    getSketchVersion() {
        return sketch.Settings.version.sketch;
    }
}

export default new Color();
