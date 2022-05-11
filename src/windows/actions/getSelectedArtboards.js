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

const SHA_KEY = 'com.frontify.artboard.sha';
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

export function removeDestinations(artboard) {
    let layer = sketch3.find(`[id="${artboard.id}"]`)[0];
    Settings.setLayerSettingForKey(layer, DESTINATION_KEY, []);
}

export function setDestinations(artboard) {
    let destinations = artboard.destinations;
    destinations = destinations.map((destination) => {
        return {
            ...destination,
            for: artboard.id,
        };
    });

    let layer = sketch3.find(`[id="${artboard.id}"]`)[0];
    Settings.setLayerSettingForKey(layer, DESTINATION_KEY, destinations);
}
export function computedSHA(artboard) {
    let layer = sketch3.find(`[id="${artboard.id}"]`)[0];
    return sha1(JSON.stringify(layer.toJSON()));
}
export function setSHA(artboard) {
    let layer = sketch3.find(`[id="${artboard.id}"]`)[0];

    let sha = sha1(JSON.stringify(layer.toJSON()));
    Settings.setLayerSettingForKey(layer, SHA_KEY, sha);
}
export function getDestinations(artboard) {
    let destinations = Settings.layerSettingForKey(artboard, DESTINATION_KEY) || [];

    let invalid = destinations.find((destination) => destination.for != artboard.id);
    if (invalid) {
        removeDestinations(artboard);
        return [];
    }
    return destinations;
}
export function getSHA(artboard) {
    return Settings.layerSettingForKey(artboard, SHA_KEY) || [];
}

export function getSelectedArtboardsFromSelection(selection, total, hasSelection) {
    let artboards = [];
    try {
        selection.forEach((layer) => {
            if (layer.type == 'Artboard') {
                // read the metadata
                artboards.push({
                    // Calculate sha1 of the current state of the artboard.
                    // After we upload an artboard, we save that sha1 to the destination.
                    // Later, we can compare changes to an artboard.
                    sha: getSHA(layer),
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
        return { success: true, artboards, total, hasSelection };
    } catch (error) {
        console.error(error);
        return { success: false };
    }
}

export function getSelectedArtboards() {
    try {
        let currentDocument = sketch3.Document.fromNative(sketch.getDocument());
        let selection = currentDocument.selectedLayers;

        let allArtboards = [];
        let selectedArtboards = [];

        // allArtboards
        currentDocument.pages.forEach((page) => {
            page.layers.forEach((layer) => {
                if (layer.type == 'Artboard') allArtboards.push(layer);
            });
        });
        // selectedArtboards
        selection.forEach((layer) => {
            if (layer.type == 'Artboard') selectedArtboards.push(layer);
        });

        let total = allArtboards.length;
        let hasSelection = selectedArtboards.length != 0;

        // If there is no selection: return all layers of type artboard
        // If there is a selection, but it doesn’t contain artboards: return all layers of type artboard
        // Else: return selected artboards

        let all = getSelectedArtboardsFromSelection(allArtboards, total, hasSelection);
        let documentArtboards = all.artboards;

        if (selection.length == 0) return { ...all, documentArtboards };
        if (selectedArtboards.length == 0) return { ...all, documentArtboards };

        return {
            ...getSelectedArtboardsFromSelection(currentDocument.selectedLayers, total, hasSelection),
            documentArtboards,
        };
    } catch (error) {
        console.error(error);
        return { success: false };
    }
}
