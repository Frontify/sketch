import sketch from '../../model/sketch';
let sketch3 = require('sketch');
import sourceModel from '../../model/source';

export async function addSource({ source, target }) {
    console.log('addsource');
    try {
        let response = await sourceModel.addSource(source, target);

        if (response.id) {
            // Set Asset ID, saved inside the Sketch File
            sketch3.Settings.setDocumentSettingForKey(sketch.getDocument(), 'remote_id', response.id);

            // Set Project ID, saved inside the Sketch File
            sketch3.Settings.setDocumentSettingForKey(sketch.getDocument(), 'remote_project_id', target.project.id);

            // Set Brand ID, saved inside the Sketch File
            sketch3.Settings.setDocumentSettingForKey(sketch.getDocument(), 'remote_brand_id', target.brand.id);
        }
        return { success: true, response };
    } catch (error) {
        return { success: false, error };
    }
}
