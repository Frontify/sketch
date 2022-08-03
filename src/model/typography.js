// Sketch API
import sketch, { Document, SharedStyle, UI } from 'sketch';

// Models
import target from './target';
import color from './color';
import filemanager from './FileManager';

// Helpers
import { findLayers, getDocument } from '../helpers/sketch';
import createFolder from '../helpers/createFolder';

class Typography {
    constructor() {
        this.colors = {};
    }

    downloadFonts(projectID) {
        target.getTarget().then(
            function (target) {
                // let folder = '' + NSHomeDirectory() + '/Frontify/' + target.brand.name + '/Fonts';
                let folder = '' + NSHomeDirectory() + '/Downloads/';

                if (createFolder(folder)) {
                    let path = folder + projectID + '.zip';
                    var downloadProgress = NSProgress.progressWithTotalUnitCount(10);
                    downloadProgress.setCompletedUnitCount(0);

                    let uri = '/v1/font/download/' + projectID;

                    return filemanager.downloadFile(uri, path, downloadProgress).then(
                        function () {
                            filemanager.openFile(path); // open and extract
                        }.bind(this)
                    );
                }
            }.bind(this)
        );
    }

    applyFontStyle(fontStyle, color, prefix) {
        let currentDocument = sketch.getSelectedDocument();
        let selection = currentDocument.selectedLayers;

        selection.layers.forEach((layer) => {
            if (layer.layers) {
                let children = layer.layers;
                children.forEach((child) => {
                    this.applyFontStyleToLayer(child, fontStyle, prefix);
                });
            } else {
                this.applyFontStyleToLayer(layer, fontStyle, prefix);
            }
        });

        let doc = getDocument();
        if (doc) {
            doc.reloadInspector();
        }
    }

    applyFontStyleToLayer(layer, fontStyle, prefix) {
        let newStyle = this.convertFontStyle(fontStyle)[0];

        let document = Document.getSelectedDocument();

        let name = prefix ? `${prefix}/${newStyle.name()}` : newStyle.name();

        let existingStyle = document.sharedTextStyles.find((sharedStyle) => sharedStyle.name == name);

        if (layer.type == 'Text') {
            if (existingStyle) {
                // Apply a Shared Style from the Library
                layer.sharedStyle = existingStyle;
                layer.style = newStyle.style();
            } else {
                // Apply style properties
                layer.style = newStyle.style();
            }
        }
    }

    convertFontStyles(fontStyles) {
        let msstyles = [];

        fontStyles.forEach(
            function (fontStyle) {
                msstyles = msstyles.concat(this.convertFontStyle(fontStyle));
            }.bind(this)
        );

        return msstyles;
    }

    convertFontStyle(fontStyle) {
        let fontManager = NSFontManager.sharedFontManager();
        let msstyles = [];

        // create a text style for each foreground color
        let colors = [];
        if (!(fontStyle.colors && fontStyle.colors.foreground)) {
            colors.push({ name: 'Default', r: 54, g: 61, b: 74, alpha: 255, css_value: 'rgba(54,61,74,1)' });
        } else {
            for (let id in fontStyle.colors.foreground) {
                if (fontStyle.colors.foreground.hasOwnProperty(id)) {
                    if (this.colors[id]) {
                        colors.push(this.colors[id]);
                    }
                }
            }
        }

        // Make sure that we have at least a default color that we can apply
        if (colors.length == 0) {
            colors.push({ name: 'Default', r: 0, g: 0, b: 0, alpha: 255, css_value: 'rgba(0, 0, 0, 1)' });
        }

        colors.forEach(
            function (colorValue) {
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
                    font = NSFont.fontWithName_size(fontStyle.family, 75);

                    // Add weight
                    if (font) {
                        if (font.familyName() == font.fontName()) {
                            let weightNumeric = fontStyle.weight ? parseInt(fontStyle.weight) : 400;
                            if (!isNaN(weightNumeric)) {
                                // Normalize font weight (from 0 - 15) -> https://developer.apple.com/documentation/appkit/nsfontmanager/1462332-fontwithfamily?language=objc
                                weightNumeric = (weightNumeric / 1200) * 15; // so that 400 / 1200 * 15 = 5
                            } else {
                                if (fontStyle.weight == 'bold' || fontStyle.weight == 'bolder') {
                                    weightNumeric = 9;
                                } else if (fontStyle.weight == 'light' || fontStyle.weight == 'lighter') {
                                    weightNumeric = 2;
                                }
                            }

                            let sizedFont = fontManager.fontWithFamily_traits_weight_size(
                                font.familyName(),
                                null,
                                weightNumeric,
                                75
                            );
                            if (sizedFont) {
                                font = sizedFont;
                            }
                        }

                        // apply italic trait
                        if (fontStyle.style && (fontStyle.style == 'ITALIC' || fontStyle.style == 'OBLIQUE')) {
                            font = fontManager.convertFont_toHaveTrait(font, NSItalicFontMask);
                        }
                    }
                } catch (e) {
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
                            spacing = (spacing / 100) * fontSize;
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
                            lineHeight = (lineHeight / 100) * fontSize;
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
                        msstyle.addAttribute_value('MSAttributedStringTextTransformAttribute', transform + 1);
                    }
                }

                msstyles.push(msstyle);
            }.bind(this)
        );

        return msstyles;
    }

    addFontStyles(fontStyles) {
        // let app = NSApp.delegate();
        let doc = getDocument();

        if (doc) {
            let msstyles = this.convertFontStyles(fontStyles);
            let sharedStyles = doc.documentData().layerTextStyles();

            msstyles.forEach(
                function (msstyle) {
                    this.updateMatchingSharedStyles(
                        Document.fromNative(doc),
                        sharedStyles,
                        sharedStyles.objects(),
                        msstyle.name(),
                        msstyle.style()
                    );
                    this.updateLayersWithStyle(sharedStyles.objects(), msstyle.name(), msstyle.style());
                }.bind(this)
            );

            // app.refreshCurrentDocument();
        }
    }

    importFontStyles(styles, prefix) {
        let document = Document.getSelectedDocument();

        // Alert that will ask for permission to update layers
        let dialogDidShow = false;
        let confirmed = false;
        const alert = NSAlert.alloc().init();

        styles.forEach((style) => {
            let convertedStyles = this.convertFontStyle(style);
            let newStyle = convertedStyles[0];

            // Prefix the style name (e.g. My Guideline/Title)
            let name = prefix ? `${prefix}/${newStyle.name()}` : newStyle.name();

            // Check if a style with the name already exists
            let existingStyle = document.sharedTextStyles.find((sharedStyle) => sharedStyle.name == name);

            if (!existingStyle) {
                // Create a new Shared Style
                SharedStyle.fromStyle({
                    name: name,
                    style: newStyle.style(),
                    document: document,
                });
            } else {
                // Find layers with the existing style and update them with the new style from Frontify
                let layers = existingStyle.getAllInstancesLayers();

                if (!dialogDidShow) {
                    alert.addButtonWithTitle('Update');
                    alert.addButtonWithTitle('Cancel');
                    // alert.setMessageText(`Update ${layers.length} Text Layer${layers.length > 1 ? 's' : ''}?`);
                    alert.setMessageText(`Update Text Layers?`);
                    alert.setInformativeText('Some layers have a Shared Style that will get updated after the import.');

                    // let imageURL = NSURL.fileURLWithPath("/Users/Kski/Downloads/myImage.png")
                    // let image = NSImage.alloc().initWithContentsOfURL(imageURL)
                    // alert.setIcon(image)

                    if (alert.runModal() == NSAlertFirstButtonReturn) {
                        confirmed = true;
                        dialogDidShow = true;
                    } else {
                        confirmed = false;
                        dialogDidShow = true;
                        // console.log('Canceled or clicked no');
                    }
                }

                if (confirmed) {
                    layers.forEach((layer) => {
                        layer.style = newStyle.style();
                    });

                    // Update the Shared Style in Sketch
                    existingStyle.style = newStyle.style();
                }
            }
        });
    }

    updateMatchingSharedStyles(doc, sharedStyles, existingTextObjects, styleName, style) {
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
        let styleSearchPredicate = NSPredicate.predicateWithFormat('name == %@', styleName);
        let filteredStyles = existingTextObjects.filteredArrayUsingPredicate(styleSearchPredicate);

        let filteredLayers = NSArray.array();
        let loopStyles = filteredStyles.objectEnumerator();
        let currentStyle;

        while ((currentStyle = loopStyles.nextObject())) {
            let predicate = NSPredicate.predicateWithFormat('style.sharedObjectID == %@', currentStyle.objectID());
            filteredLayers = filteredLayers.arrayByAddingObjectsFromArray(findLayers(predicate));
        }

        for (let i = 0; i < filteredLayers.length; i++) {
            filteredLayers[i].style = style;
        }
    }
}

export default new Typography();
