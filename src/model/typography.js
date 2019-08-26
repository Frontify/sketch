import target from './target';
import color from './color';
import sketch from './sketch';
import filemanager from './filemanager';
import fetch from '../helpers/fetch';
import createFolder from '../helpers/createFolder'
import { isWebviewPresent, sendToWebview } from 'sketch-module-web-view/remote'

class Typography {
    constructor() {
        this.colors = {};
    }

    downloadFonts() {
        target.getTarget().then(function (target) {
            let folder = '' + NSHomeDirectory() + '/Frontify/' + target.brand.name + '/Fonts';
            if(createFolder(folder)) {
                let path = folder + '/' + target.project.name + '.zip';
               return fetch('/v1/font/download/' + target.project.hub_project_id, { is_file_download: true, filepath: path }).then(function() {
                    filemanager.openFile(path); // open and extract
               }.bind(this));
            }
        }.bind(this));
    }

    getFontStyles(project) {
        // load typography styles
        return fetch('/v1/typography/styles/' + project).then(function (data) {
            this.colors = data.colors;

            // only include installable fonts
            data.fonts = data.fonts || [];
            data.fonts = data.fonts.filter(function(font) {
                return !!font.install_name;
            });

            return data;
        }.bind(this));
    }

    applyFontStyle(fontStyle) {
        let selection = sketch.getSelection();
        let loop = selection.objectEnumerator();
        let item = null;

        while (item = loop.nextObject()) {
            if (item.class() == MSLayerGroup) {
                let layers = item.layers();
                layers.forEach(function (layer) {
                    this.applyFontStyleToLayer(layer, fontStyle);
                }.bind(this));
            }
            else {
                this.applyFontStyleToLayer(item, fontStyle);
            }
        }

        let doc = sketch.getDocument();
        if(doc) {
            doc.reloadInspector();
        }
    }

    applyFontStyleToLayer(layer, fontStyle) {
        let msstyle = this.convertFontStyle(fontStyle)[0];

        if (layer.class() == MSTextLayer) {
            layer.style = msstyle.style();
        }
    }

    convertFontStyles(fontStyles) {
        let msstyles = [];

        fontStyles.forEach(function (fontStyle) {
            msstyles = msstyles.concat(this.convertFontStyle(fontStyle));
        }.bind(this));

        return msstyles;
    }

    convertFontStyle(fontStyle) {
        let fontManager = NSFontManager.sharedFontManager();
        let msstyles = [];

        // create a text style for each foreground color
        let colors = [];
        if (!(fontStyle.colors && fontStyle.colors.foreground)) {
            colors.push({ name: 'Default', r: 54, g: 61, b: 74, alpha: 255, css_value: 'rgba(54,61,74,1)'});
        }
        else {
            for (let id in fontStyle.colors.foreground) {
                if (fontStyle.colors.foreground.hasOwnProperty(id)) {
                    if (this.colors[id]) {
                        colors.push(this.colors[id])
                    }
                }
            }
        }

        colors.forEach(function (colorValue) {
            let rectTextFrame = NSMakeRect(0, 0, 250, 50);
            let msstyle = MSTextLayer.alloc().initWithFrame(rectTextFrame);

            let fontSize = parseFloat(fontStyle.size);
            let spacing = parseFloat(fontStyle.spacing);
            let lineHeight = parseFloat(fontStyle.line_height);

            msstyle.textColor = color.convertColor(colorValue, 'MSColor');

            msstyle.name = (fontStyle.name || 'Untitled Style') + '/' + colorValue.name;
            msstyle.stringValue = fontStyle.example || 'Untitled Style';
            msstyle.fontSize = fontSize;

            // Get font postscript name
            let font = null;
            try {
                // Initialize the font
                let font = NSFont.fontWithName_size(fontStyle.family, 75);

                // Add weight
                if(font) {
                    if(font.familyName() == font.fontName()) {
                        let weightNumeric = fontStyle.weight ? parseInt(fontStyle.weight) : 400;
                        if(!isNaN(weightNumeric)) {
                            // Normalize font weight (from 0 - 15) -> https://developer.apple.com/documentation/appkit/nsfontmanager/1462332-fontwithfamily?language=objc
                            weightNumeric = weightNumeric / 1200 * 15; // so that 400 / 1200 * 15 = 5
                        }
                        else {
                            if(fontStyle.weight == 'bold' || fontStyle.weight == 'bolder') {
                                weightNumeric = 9;
                            }
                            else if(fontStyle.weight == 'light' || fontStyle.weight == 'lighter') {
                                weightNumeric = 2;
                            }
                        }

                        let sizedFont = fontManager.fontWithFamily_traits_weight_size(font.familyName(), null, weightNumeric, 75);
                        if(sizedFont) {
                            font = sizedFont;
                        }
                    }

                    // apply italic trait
                    if (fontStyle.style && (fontStyle.style == 'ITALIC' || fontStyle.style == 'OBLIQUE')) {
                        font = fontManager.convertFont_toHaveTrait(font, NSItalicFontMask)
                    }
                }
            }
            catch(e) {
                console.log(e);
            }

            if (!font) {
                // apply fallback font
                font = fontManager.fontWithFamily_traits_weight_size('Times', null, 5, 75);
            }

            msstyle.fontPostscriptName = font.fontName();


            if (fontStyle.align) {
                let possibleAligns = ['LEFT', 'RIGHT', 'CENTER', 'JUSTIFY'];
                let align = possibleAligns.indexOf(fontStyle.align);

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

                msstyle.characterSpacing = spacing * 10;
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
                let possibleTransforms = ['UPPERCASE', 'LOWERCASE', 'RIGHT', 'JUSTIFY'];
                let transform = possibleTransforms.indexOf(fontStyle.transform);

                if (transform >= 0) {
                    msstyle.addAttribute_value("MSAttributedStringTextTransformAttribute", transform + 1);
                }
            }

            msstyles.push(msstyle);
        }.bind(this));

        return msstyles;
    }

    addFontStyles(fontStyles) {
        let app = NSApp.delegate();
        let doc = sketch.getDocument();
        if(doc) {
            let msstyles = this.convertFontStyles(fontStyles);
            let sharedStyles = doc.documentData().layerTextStyles();

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
            for (let i = 0; i < existingTextObjects.count(); i++) {
                let existingName = '' + existingTextObjects[i].name();
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
        let styleSearchPredicate = NSPredicate.predicateWithFormat("name == %@", styleName);
        let filteredStyles = existingTextObjects.filteredArrayUsingPredicate(styleSearchPredicate);

        let filteredLayers = NSArray.array();
        let loopStyles = filteredStyles.objectEnumerator();
        let currentStyle;

        while (currentStyle = loopStyles.nextObject()) {
            let predicate = NSPredicate.predicateWithFormat("style.sharedObjectID == %@", currentStyle.objectID());
            filteredLayers = filteredLayers.arrayByAddingObjectsFromArray(sketch.findLayers(predicate));
        }

        for (let i = 0; i < filteredLayers.length; i++) {
            filteredLayers[i].style = style;
        }
    }

    showTypography() {
        target.getAssetSourcesForType('typography').then(function(assetSources) {
            if(assetSources && assetSources.selected) {
                this.getFontStyles(assetSources.selected.id).then(function (data) {
                    if (isWebviewPresent('frontifymain')) {
                        data.project = assetSources.selected;
                        sendToWebview('frontifymain', 'showAssetSources(' + JSON.stringify(assetSources) + ')');
                        sendToWebview('frontifymain', 'showTypography(' + JSON.stringify(data) + ')');
                    }
                }.bind(this));
            }
        }.bind(this));
    }
}

export default new Typography();

