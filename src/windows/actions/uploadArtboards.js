import Artboard from '../../model/artboard';
import { computedSHA, setDestinations, setSHA } from './getSelectedArtboards';

/**
 * uploadArtboards
 * @param {Array} artboards
 */
export function uploadArtboards({ artboards }) {
    let queue = [];

    artboards.forEach((artboard) => {
        if (!artboard.destinations) return;

        setDestinations(artboard);

        let sha = computedSHA(artboard);

        setSHA(artboard);

        artboard.destinations.forEach((destination) => {
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
        Artboard.uploadArtboards(queue);
    } catch (error) {
        console.error(error);
    }
}
