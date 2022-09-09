import Artboard from '../../model/artboard';

/**
 * In Sketch, it is possible that artboards have duplicate names.
 * But on Frontify, we want to avoid assets with the same name in the same folder.
 * That means, that if we here find out that an artboard should be uploaded with name "A"
 * and there is another artboard elsewhere with the name "A", then the latter should no longer
 * be uploaded. Hence, we remove the destination.
             
*/
function removeDuplicates(trackedArtboards, artboard, destination) {
    // Find artboards with the same name and remove the existing destination
    let duplicateArtboards = trackedArtboards.filter((a) => a.name == artboard.name && a.id != artboard.id);

    // Look for matching destinations and remove them
    duplicateArtboards.forEach((a) => {
        a.destinations.forEach((d) => {
            if (d.remote_id == destination.remote_id) {
                Artboard.removeDestination(a, d);
            }
        });
    });
}
/**
 * uploadArtboards
 * @param {Array} artboards
 */
export function uploadArtboards({ artboards, brandID, force = false }) {
    let { documentArtboards } = Artboard.getTrackedArtboardsAndSymbols(brandID);

    let queue = [];

    artboards.forEach((artboard) => {
        if (!artboard.destinations) return;

        Artboard.setDestinations(artboard, brandID);

        artboard.destinations.forEach((destination) => {
            removeDuplicates(documentArtboards, artboard, destination);

            queue.push({
                id: destination.remote_id, // Frontify ID
                id_external: artboard.id, // Sketch ID
                name: '' + artboard.name.replace(/\s*\/\s*/g, '/'),
                dirty: artboard.dirty,
                ext: 'png',
                sha: Artboard.shaForArtboard(artboard),
                state: 'new',
                target: destination,
                modified: null,
                modifier_name: null,
                modified_localized_ago: null,
            });
        });
    });

    // This will notify the frontend about each new upload
    queue.forEach((entry) => {
        Artboard.queueUpload(entry);
    });

    try {
        Artboard.uploadArtboards(queue, brandID, force);
    } catch (error) {
        console.error(error);
    }
}
