import target from './target';
import fetch from '../helpers/fetch'

class Color {
    constructor() {
        this.selection = null;
    }

    setSelection(selection) {
        this.selection = selection;
    }

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
        var selection = this.selection;
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
    }

    applyColorToLayer(layer, color) {
        var mscolor = MSColor.colorWithRed_green_blue_alpha(color.r / 255, color.g / 255, color.b / 255, color.a / 255);

        if (layer.class() == MSTextLayer) {
            layer.setTextColor(mscolor);
        }
        else if (layer.class() == MSShapeGroup) {
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

    showColors(ui) {
        this.getColors().then(function (data) {
            ui.eval('showColors(' + JSON.stringify(data) + ')');
        }.bind(this));
    }
}

export default new Color();

