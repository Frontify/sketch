import sketch from '../../model/sketch';
let sketch3 = require('sketch');
let Settings = require('sketch/settings');
import { sha1 } from '../../helpers/sha1';

/**
 * Every artboard that are tracked on Frontify should have additonal meta data that
 * describes the upload destinations. That information should be stored inside the Sketch file.
 *
 * When the information is stored on the artboard layer itself, we might run into issues when
 * an artboard with metadata is duplicated. Instead, we could store the export metadata on the file itself.
 *
 * Or: we could keep it on the artboard but also store the original artboard UUID. Then, we can verify that the
 * metadata belongs to a different artboard and discard it.
 *
 * { remote_project_id: 191277, remote_id: 6448905, remote_path: '/Export Folder/' }
 */

const DESTINATION_KEY = 'com.frontify.artboard.destinations';

export function patchDestinations(artboardID, destination) {
    let layer = sketch3.find(`[id="${artboardID}"]`)[0];
    let destinations = Settings.layerSettingForKey(layer, DESTINATION_KEY);
    let patchedDestinations = destinations.map((original) => {
        if (
            original.remote_project_id == destination.remote_project_id &&
            original.remote_path == destination.remote_path
        ) {
            // Patch
            return destination;
        } else {
            return original;
        }
    });

    Settings.setLayerSettingForKey(layer, DESTINATION_KEY, patchedDestinations);
}

export function setDestinations(artboard) {
    let layer = sketch3.find(`[id="${artboard.id}"]`)[0];
    Settings.setLayerSettingForKey(layer, DESTINATION_KEY, artboard.destinations);
}
export function getDestinations(artboard) {
    return Settings.layerSettingForKey(artboard, DESTINATION_KEY) || [];
}

export function getSelectedArtboardsFromSelection(selection) {
    let artboards = [];
    try {
        selection.forEach((layer) => {
            if (layer.type == 'Artboard') {
                // read the metadata
                artboards.push({
                    // Calculate sha1 of the current state of the artboard.
                    // After we upload an artboard, we save that sha1 to the destination.
                    // Later, we can compare changes to an artboard.
                    sha: sha1(JSON.stringify(layer.toJSON())),
                    type: layer.type,
                    name: layer.name,
                    id: layer.id,
                    destinations: getDestinations(layer),
                });
            }
        });

        artboards = artboards.sort((a, b) => {
            return a.name > b.name ? 1 : -1;
        });
        return { success: true, artboards };
    } catch (error) {
        console.error(error);
        return { success: false };
    }
}

export function getSelectedArtboards() {
    try {
        let currentDocument = sketch3.Document.fromNative(sketch.getDocument());

        return getSelectedArtboardsFromSelection(currentDocument.selectedLayers);
    } catch (error) {
        console.error(error);
        return { success: false };
    }
}
