// Sketch API
import { Settings } from 'sketch';

// Helpers
import { getDocument } from '../../helpers/sketch';

// Model
import Source from '../../model/source';

export async function addSource({ source, target }) {
    try {
        let response = await Source.addSource(source, target);

        if (response.id) {
            // Set Asset ID, saved inside the Sketch File
            Settings.setDocumentSettingForKey(getDocument(), 'remote_id', response.id);

            // Set Project ID, saved inside the Sketch File
            Settings.setDocumentSettingForKey(getDocument(), 'remote_project_id', target.project.id);

            // Set Brand ID, saved inside the Sketch File
            Settings.setDocumentSettingForKey(getDocument(), 'remote_brand_id', target.brand.id);
        }
        return { success: true, response };
    } catch (error) {
        return { success: false, error };
    }
}
