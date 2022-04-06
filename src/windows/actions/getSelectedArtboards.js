import sketch from '../../model/sketch';
let sketch3 = require('sketch');

export function getSelectedArtboards() {
    try {
        let currentDocument = sketch3.Document.fromNative(sketch.getDocument());

        let artboards = [];
        currentDocument.selectedLayers.forEach((layer) => {
            if (layer.type == 'Artboard') {
                artboards.push(layer);
            }
        });
        return { success: true, artboards };
    } catch (error) {
        console.error(error);
        return { success: false };
    }
}
