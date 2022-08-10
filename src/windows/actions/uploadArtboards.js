import Artboard from '../../model/artboard';
import { computedSHA, getSelectedArtboards, removeDestination, setDestinations, setSHA } from './getSelectedArtboards';

/**
 * uploadArtboards
 * @param {Array} artboards
 */
export function uploadArtboards({ artboards, brandID }) {
    let { documentArtboards } = getSelectedArtboards(brandID, false);
    console.log('uploadArtboards', documentArtboards, artboards);
    let queue = [];

    artboards.forEach((artboard) => {
        if (!artboard.destinations) return;

        setDestinations(artboard, brandID);

        let sha = computedSHA(artboard);

        setSHA(artboard);

        artboard.destinations.forEach((destination) => {
            /**
             * In Sketch, it is possible that artboards have duplicate names.
             * But on Frontify, we want to avoid assets with the same name in the same folder.
             * That means, that if we here find out that an artboard should be uploaded with name "A"
             * and there is another artboard elsewhere with the name "A", then the latter should no longer
             * be uploaded. Hence, we remove the destination.
             
             */

            // Find artboards with the same name and remove the existing destination
            let duplicateArtboards = documentArtboards.filter((a) => a.name == artboard.name && a.id != artboard.id);

            // Look for matching destinations and remove them
            duplicateArtboards.forEach((a) => {
                a.destinations.forEach((d) => {
                    if (d.remote_id == destination.remote_id) {
                        removeDestination(a, d);
                        console.log('removed dest');
                    }
                });
            });
            queue.push({
                id: destination.remote_id, // Frontify ID
                id_external: artboard.id, // Sketch ID
                name: '' + artboard.name.replace(/\s*\/\s*/g, '/'),
                ext: 'png',
                sha: sha,
                state: 'new',
                target: destination,
                modified: null,
                modifier_name: null,
                modified_localized_ago: null,
            });
        });
        Artboard.queueUpload(artboard);
    });

    queue.forEach((entry) => {
        Artboard.queueUpload(entry);
    });

    try {
        Artboard.uploadArtboards(queue, brandID);
    } catch (error) {
        console.error(error);
    }
}
