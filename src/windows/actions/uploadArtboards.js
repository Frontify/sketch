import Artboard from '../../model/artboard';

/**
 * Mock data
 */
const $mock = {
    // We can either store these export destinations on the artboard layer itself,
    // or we can save them in the file settings. If we store them in the file’s settings
    // then we might end up with some garbage when artboards are deleted.
    destinations: {
        'B0B2D233-348B-485E-A7AC-AE3844C7E683': [
            { remote_project_id: 191277, remote_id: 6448905, remote_path: '/Export Folder/' },
        ],
        '33B852D4-0957-495B-9701-1A83E5BCD5AB': [
            { remote_project_id: 191277, remote_id: null, remote_path: '/Export Folder/' },
        ],
    },
};

function lookup(id) {
    if (!$mock['destinations'][id]) {
        console.warn('No upload destinations found for artboard with id', id);
        return [];
    }
    return $mock['destinations'][id];
}
/**
 * uploadArtboards
 * @param {Array} artboards
 */
export function uploadArtboards({ artboards }) {
    console.log('upload', artboards);
    let queue = [];

    artboards.forEach((artboard) => {
        lookup(artboard.id).forEach((destination) => {
            queue.push({
                id: destination.remote_id, // Frontify ID
                id_external: artboard.id, // Sketch ID
                name: '' + artboard.name.replace(/\s*\/\s*/g, '/'),
                ext: 'png',
                sha: null,
                state: 'new',
                target: destination,
                modified: null,
                modifier_name: null,
                modified_localized_ago: null,
            });
        });
    });
    console.log(queue);

    try {
        Artboard.uploadArtboards(queue);
    } catch (error) {
        console.error(error);
    }
}
