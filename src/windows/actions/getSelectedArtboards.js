// Sketch API
import sketch, { Settings } from 'sketch';

// Helpers
import { getDocument } from '../../helpers/sketch';
import { sha1 } from '../../helpers/sha1';
import { Profiler } from '../../model/Profiler';
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

let profiler = new Profiler();

export function patchDestinations(artboardID, destination) {
    let layer = sketch.find(`[id="${artboardID}"]`)[0];
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
    let layer = sketch.find(`[id="${artboard.id}"]`)[0];
    Settings.setLayerSettingForKey(layer, DESTINATION_KEY, []);
}

export function removeDestination(artboard, destination) {
    let layer = sketch.find(`[id="${artboard.id}"]`)[0];
    let destinations = Settings.layerSettingForKey(layer, DESTINATION_KEY);
    let patchedDestinations = destinations.filter((original) => {
        if (
            original.remote_project_id == destination.remote_project_id &&
            original.remote_path == destination.remote_path
        ) {
            // Remove it if it exist
            return false;
        } else {
            // Keep it
            return true;
        }
    });
    Settings.setLayerSettingForKey(layer, DESTINATION_KEY, patchedDestinations);
}

export function setDestinations(artboard, brandID) {
    let destinations = artboard.destinations;
    destinations = destinations.map((destination) => {
        return {
            ...destination,
            for: artboard.id,
            remote_brand_id: destination.remote_brand_id ? destination.remote_brand_id : brandID,
        };
    });

    let layer = sketch.find(`[id="${artboard.id}"]`)[0];
    Settings.setLayerSettingForKey(layer, DESTINATION_KEY, destinations);
}

function shaForArtboard(artboard) {
    let layer = sketch.find(`[id="${artboard.id}"]`)[0];

    return shaForLayer(layer);
}

function shaForLayer(layer) {
    return Settings.layerSettingForKey(layer, 'dirty');
}
function shaForLayerLegacy(layer) {
    // Set the "selected" property to false, so that the SHA is computed consistently
    // Otherwise, the SHA would be different for a selected / unselected artboard…
    profiler.start('layer.toJSON()');
    let json = layer.toJSON();

    profiler.end();

    profiler.start('modify propreties on JSON');
    json.selected = false;
    profiler.end();

    // Force coordinates, so that moving artboards around doesn’t trigger a change
    json.frame.x = 0;
    json.frame.y = 0;

    profiler.start('JSON.stringify(json)');
    let stringified = JSON.stringify(json);
    profiler.end();

    // We also need to make sure that the "selected" property of any layer is ignored.
    // Otherwise, changing the selection of layers would trigger artboard modification (although nothing has visually changed)
    // Instead of actually deselecting layers recursively, we just replace the text that we use for comparisons.
    profiler.start('replaceAll');
    let purged = stringified.replaceAll(`"selected":true`, `"selected":false`);
    profiler.end();

    profiler.start('sha1(purged)');
    let sha = sha1(purged);
    profiler.end();

    return sha;
}

export function computedSHA(artboard) {
    return shaForArtboard(artboard);
}
export function setSHA(artboard) {
    let layer = sketch.find(`[id="${artboard.id}"]`)[0];

    let sha = shaForLayer(layer);

    Settings.setLayerSettingForKey(layer, SHA_KEY, sha);
}
export function getDestinations(artboard, brandID) {
    let destinations = Settings.layerSettingForKey(artboard, DESTINATION_KEY) || [];

    const invalid = destinations.find((destination) => destination.for != artboard.id);
    if (invalid) {
        removeDestinations(artboard);
        return [];
    }

    const destinationsForBrand = destinations.filter(
        (destination) => brandID && destination.remote_brand_id == brandID
    );

    return destinationsForBrand;
}
export function getCachedSHA(artboard) {
    return Settings.layerSettingForKey(artboard, SHA_KEY) || '';
}

export function getSelectedArtboardsFromSelection(brandID, selection, total, hasSelection, useCachedSHA = true) {
    profiler.start(`getSelectedArtboardsFromSelection useCachedSHA = ${useCachedSHA}`);
    let artboards = [];
    try {
        selection.forEach((layer) => {
            if (layer.type == 'Artboard') {
                // read the metadata

                if (!useCachedSHA) setSHA(layer);

                artboards.push({
                    // Calculate sha1 of the current state of the artboard.
                    // After we upload an artboard, we save that sha1 to the destination.
                    // Later, we can compare changes to an artboard.
                    // Here we used to return a cached version but this caused
                    // some out-of-sync states where changes wouldn’t show up.
                    // Since we don’t request artboards that often, it might be okay to compute
                    // the SHA with every request?
                    sha: getCachedSHA(layer),
                    dirty: Settings.layerSettingForKey(layer, 'dirty'),
                    type: layer.type,
                    name: layer.name,
                    id: layer.id,
                    destinations: getDestinations(layer, brandID),
                });
            }
        });

        artboards = artboards.sort((a, b) => {
            return a.name > b.name ? 1 : -1;
        });
        profiler.end();
        return { success: true, artboards, total, hasSelection };
    } catch (error) {
        console.error(error);
        profiler.end();
        return { success: false };
    }
}

export function getSelectedArtboards(brandID, useCachedSHA = true) {
    // remember the brand

    profiler.start('set session variable');

    if (brandID) {
        Settings.setSessionVariable('com.frontify.sketch.recent.brand.id', '' + brandID);
    }

    profiler.end();
    try {
        profiler.start('sketch.getSelectedDocument()');
        let currentDocument = sketch.getSelectedDocument();
        profiler.end();

        if (!currentDocument)
            return {
                artboards: [],
                total: 0,
                selection: [],
                success: true,
                documentArtboards: [],
            };
        profiler.start('currentDocument.selectedLayers');
        let selection = currentDocument.selectedLayers;
        profiler.end();

        let allArtboards = [];
        let selectedArtboards = [];

        profiler.start('currentDocument.pages.forEach');

        // allArtboards
        currentDocument.pages.forEach((page) => {
            page.layers.forEach((layer) => {
                if (layer.type == 'Artboard') {
                    allArtboards.push(layer);
                }
            });
        });
        profiler.end();
        // selectedArtboards
        selection.forEach((layer) => {
            if (layer.type == 'Artboard') selectedArtboards.push(layer);
        });

        let total = allArtboards.length;
        let hasSelection = selectedArtboards.length != 0;

        // If there is no selection: return all layers of type artboard
        // If there is a selection, but it doesn’t contain artboards: return all layers of type artboard
        // Else: return selected artboards

        profiler.start(
            `getSelectedArtboardsFromSelection(brandID, allArtboards, total, hasSelection, useCachedSHA = ${useCachedSHA})`
        );

        let all = getSelectedArtboardsFromSelection(brandID, allArtboards, total, hasSelection, useCachedSHA);
        let documentArtboards = all.artboards;

        if (selection.length == 0) return { ...all, documentArtboards };
        if (selectedArtboards.length == 0) return { ...all, documentArtboards };

        profiler.end();

        profiler.start(
            'getSelectedArtboardsFromSelection(brandID, currentDocument.selectedLayers, total, hasSelection, true)'
        );
        let artboardsFromSelectedLayers = getSelectedArtboardsFromSelection(
            brandID,
            currentDocument.selectedLayers,
            total,
            hasSelection,
            true
        );

        profiler.end();

        // Always use cache here
        return {
            ...artboardsFromSelectedLayers,
            documentArtboards,
        };
    } catch (error) {
        console.error(error);
        return { success: false };
    }
}
