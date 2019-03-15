import target from './target';
import fetch from '../helpers/fetch'
import sketch from './sketch';
import { isWebviewPresent, sendToWebview } from 'sketch-module-web-view/remote'

class Color {
    getColors() {
        return target.getTarget().then(function (target) {
            // load remote assets status
            return fetch('/v1/color/library/' + target.project.id).then(function (data) {
                data.hub_id = target.project.hub_id;
                return data;
            }.bind(this));
        }.bind(this));
    }

    applyColor(color) {
        var selection = sketch.getSelection();
        var loop = selection.objectEnumerator();
        var item = null;

        while (item = loop.nextObject()) {
            if (item.class() == MSLayerGroup) {
                var layers = item.layers();
                layers.forEach(function (layer) {
                    this.applyColorToLayer(layer, color);
                }.bind(this));
            }
            else {
                this.applyColorToLayer(item, color);
            }
        }

        var doc = sketch.getDocument();
        if(doc) {
            doc.reloadInspector();
        }
    }

    addDocumentColors(colors) {
        var app = NSApp.delegate();
        var doc = sketch.getDocument();
        if(doc) {
            var assets = doc.documentData().assets();
            var mscolors = this.convertColors(colors);
            assets.addColors(mscolors);
            app.refreshCurrentDocument();
        }
    }

    replaceDocumentColors(colors) {
        var app = NSApp.delegate();
        var doc = sketch.getDocument();
        if(doc) {
            var assets = doc.documentData().assets();
            var mscolors = this.convertColors(colors);
            assets.setColors([]);
            assets.addColors(mscolors);
            app.refreshCurrentDocument();
        }

    }

    addGlobalColors(colors) {
        var app = NSApp.delegate();
        var assets = app.globalAssets();
        var mscolors = this.convertColors(colors);
        assets.addColors(mscolors);
        app.refreshCurrentDocument();
    }

    replaceGlobalColors(colors) {
        var app = NSApp.delegate();
        var assets = app.globalAssets();
        var mscolors = this.convertColors(colors);
        assets.setColors([]);
        assets.addColors(mscolors);
        app.refreshCurrentDocument();
    }

    convertColors(colors) {
        var mscolors = [];
        colors.forEach(function (color) {
            mscolors.push(this.convertColor(color));
        }.bind(this));

        return mscolors;
    }

    convertColor(color) {
        return MSColor.colorWithRed_green_blue_alpha(color.r / 255, color.g / 255, color.b / 255, (color.alpha || color.a) / 255);
    }

    applyColorToLayer(layer, color) {
        var mscolor = MSColor.colorWithRed_green_blue_alpha(color.r / 255, color.g / 255, color.b / 255, color.a / 255);
        var clazz = layer.class();

        if (clazz == MSTextLayer) {
            layer.setTextColor(mscolor);
        }
        else if(clazz == MSRectangleShape || clazz == MSOvalShape || clazz == MSTriangleShape || clazz == MSStarShape || clazz == MSPolygonShape || clazz == MSShapePathLayer) {
            var fills = layer.style().fills();
            if (fills.count() <= 0) {
                fills.addNewStylePart();
            }
            var fill = fills.firstObject();
            fill.isEnabled = true;
            fill.setFillType(0);
            fill.setColor(mscolor);
        }
    }

    showColors() {
        this.getColors().then(function (data) {
            if (isWebviewPresent('frontifymain')) {
                sendToWebview('frontifymain', 'showColors(' + JSON.stringify(data) + ')');
            }
        }.bind(this));
    }
}

export default new Color();

