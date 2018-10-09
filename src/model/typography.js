import target from './target';
import color from './color';
import sketch from './sketch';
import filemanager from './filemanager';
import fetch from '../helpers/fetch';
import createFolder from '../helpers/createFolder'

class Typography {
    constructor() {
        this.colors = {};
    }

    downloadFonts() {
        target.getTarget().then(function (target) {
            var folder = '' + NSHomeDirectory() + '/Frontify/' + target.brand.name + '/Fonts';
            if(createFolder(folder)) {
                var path = folder + '/' + target.project.name + '.zip';
               return fetch('/v1/font/download/' + target.project.hub_project_id, { is_file_download: true, filepath: path }).then(function() {
                    filemanager.openFile(path); // open and extract
               }.bind(this));
            }
        }.bind(this));
    }

    getFontStyles() {
        return target.getTarget().then(function (target) {
            // load typography styles
            return fetch('/v1/typography/styles/' + target.project.hub_project_id).then(function (data) {
                data.hub_id = target.project.hub_id;
                this.colors = data.colors;

                // only include installable fonts
                data.fonts = data.fonts.filter(function(font) {
                    return !!font.install_name;
                });

                return data;
            }.bind(this));
        }.bind(this));
    }

    applyFontStyle(fontStyle) {
        var selection = sketch.getSelection();
        var loop = selection.objectEnumerator();
        var item = null;

        while (item = loop.nextObject()) {
            if (item.class() == MSLayerGroup) {
                var layers = item.layers();
                layers.forEach(function (layer) {
                    this.applyFontStyleToLayer(layer, fontStyle);
                }.bind(this));
            }
            else {
                this.applyFontStyleToLayer(item, fontStyle);
            }
        }

        var doc = sketch.getDocument();
        if(doc) {
            doc.reloadInspector();
        }
    }

    applyFontStyleToLayer(layer, fontStyle) {
        var msstyle = this.convertFontStyle(fontStyle)[0];

        if (layer.class() == MSTextLayer) {
            layer.style = msstyle.style();
        }
    }

    convertFontStyles(fontStyles) {
        var msstyles = [];

        fontStyles.forEach(function (fontStyle) {
            msstyles = msstyles.concat(this.convertFontStyle(fontStyle));
        }.bind(this));

        return msstyles;
    }

    convertFontStyle(fontStyle) {
        var fontManager = NSFontManager.sharedFontManager();
        var msstyles = [];

        // create a text style for each foreground color
        var colors = [];
        if (!(fontStyle.colors && fontStyle.colors.foreground)) {
            colors.push({name: 'Default', r: 54, g: 61, b: 74, alpha: 255, css_value: 'rgba(54,61,74,1)'});
        }
        else {
            for (var id in fontStyle.colors.foreground) {
                if (fontStyle.colors.foreground.hasOwnProperty(id)) {
                    if (this.colors[id]) {
                        colors.push(this.colors[id])
                    }
                }
            }
        }

        colors.forEach(function (colorValue) {
            var rectTextFrame = NSMakeRect(0, 0, 250, 50);
            var msstyle = MSTextLayer.alloc().initWithFrame(rectTextFrame);

            var fontSize = parseFloat(fontStyle.size);
            var spacing = parseFloat(fontStyle.spacing);
            var lineHeight = parseFloat(fontStyle.line_height);

            msstyle.textColor = color.convertColor(colorValue);

            msstyle.name = (fontStyle.name || 'Untitled Style') + '/' + colorValue.name;
            msstyle.stringValue = fontStyle.example || 'Untitled Style';
            msstyle.fontSize = fontSize;

            // Get font name
            var weightNumeric = !isNaN(parseInt(fontStyle.weight)) ? parseInt(fontStyle.weight) : 400;
            if (fontStyle.weight && (fontStyle.weight == 'bold' || fontStyle.weight == 'bolder')) {
                weightNumeric = 700;
            }

            var traits = null;
            if (fontStyle.style && (fontStyle.style == 'ITALIC' || fontStyle.style == 'OBLIQUE')) {
                traits = NSItalicFontMask;
            }

            var font = fontManager.fontWithFamily_traits_weight_size(fontStyle.family, traits, weightNumeric, 75);
            if (!font) {
                font = fontManager.fontWithFamily_traits_weight_size('Times', null, weightNumeric, 75);
            }

            msstyle.fontPostscriptName = font.fontName();

            if (fontStyle.align) {
                var possibleAligns = ['LEFT', 'RIGHT', 'CENTER', 'JUSTIFY'];
                var align = possibleAligns.indexOf(fontStyle.align);

                if (align >= 0) {
                    msstyle.textAlignment = align;
                }
            }

            if (spacing) {
                switch (fontStyle.spacing_unit) {
                    case '%':
                        spacing = spacing / 100 * fontSize;
                        break;

                }

                msstyle.characterSpacing = spacing;
            }

            if (lineHeight) {
                switch (fontStyle.line_height_unit) {
                    case 'px':
                        lineHeight = lineHeight;
                        break;
                    case '%':
                        lineHeight = lineHeight / 100 * fontSize;
                        break;
                    default:
                        lineHeight = lineHeight * fontSize;
                }

                msstyle.lineHeight = lineHeight;
            }


            if (fontStyle.decoration) {
                switch (fontStyle.decoration) {
                    case 'underline':
                        msstyle.addAttribute_value('NSUnderline', 1);
                        break;
                    case 'line-through':
                        msstyle.addAttribute_value('NSStrikethrough', 1);
                        break;
                }
            }

            if (fontStyle.transform) {
                var possibleTransforms = ['UPPERCASE', 'LOWERCASE', 'RIGHT', 'JUSTIFY'];
                var transform = possibleTransforms.indexOf(fontStyle.transform);

                if (transform >= 0) {
                    msstyle.addAttribute_value("MSAttributedStringTextTransformAttribute", transform + 1);
                }
            }

            msstyles.push(msstyle);
        }.bind(this));

        return msstyles;
    }

    addFontStyles(fontStyles) {
        var app = NSApp.delegate();
        var doc = sketch.getDocument();
        if(doc) {
            var msstyles = this.convertFontStyles(fontStyles);
            var sharedStyles = doc.documentData().layerTextStyles();

            msstyles.forEach(function (msstyle) {
                this.updateMatchingSharedStyles(sharedStyles, sharedStyles.objects(), msstyle.name(), msstyle.style());
                this.updateLayersWithStyle(sharedStyles.objects(), msstyle.name(), msstyle.style())
            }.bind(this));

            app.refreshCurrentDocument();
        }
    }

    updateMatchingSharedStyles(sharedStyles, existingTextObjects, styleName, style) {
        styleName = '' + styleName;
        if (existingTextObjects.count() != 0) {
            for (var i = 0; i < existingTextObjects.count(); i++) {
                var existingName = '' + existingTextObjects[i].name();
                if (existingName == styleName) {
                    sharedStyles.updateValueOfSharedObject_byCopyingInstance(existingTextObjects[i], style);
                    return;
                }
            }

            sharedStyles.addSharedStyleWithName_firstInstance(styleName, style);
        } else {
            sharedStyles.addSharedStyleWithName_firstInstance(styleName, style);
        }
    }

    updateLayersWithStyle(existingTextObjects, styleName, style) {
        // Get sharedObjectID of shared style with specified name
        var styleSearchPredicate = NSPredicate.predicateWithFormat("name == %@", styleName);
        var filteredStyles = existingTextObjects.filteredArrayUsingPredicate(styleSearchPredicate);

        var filteredLayers = NSArray.array();
        var loopStyles = filteredStyles.objectEnumerator();
        var currentStyle;

        while (currentStyle = loopStyles.nextObject()) {
            var predicate = NSPredicate.predicateWithFormat("style.sharedObjectID == %@", currentStyle.objectID());
            filteredLayers = filteredLayers.arrayByAddingObjectsFromArray(sketch.findLayers(predicate));
        }

        for (var i = 0; i < filteredLayers.length; i++) {
            filteredLayers[i].style = style;
        }
    }

    showTypography(ui) {
        this.getFontStyles().then(function (data) {
            ui.eval('showTypography(' + JSON.stringify(data) + ')');
        }.bind(this));
    }
}

export default new Typography();

