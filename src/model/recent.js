const sketch = require('sketch');

class RecentFiles {
    constructor() {
        this.recents = sketch.Settings.settingForKey('com.frontify.sketch.recent') || [];
    }
    clear() {
        sketch.Settings.setSettingForKey('com.frontify.sketch.recent', []);
    }
    get() {
        return this.recents;
    }
    push(entry = {}) {
        console.log('push to recent files', entry);
        // Remove any existing items with the given ID
        this.recents = this.recents.filter((item) => item.uuid != entry.uuid);

        // Move the entry to the front
        this.recents.unshift({ ...entry, timestamp: new Date().getTime() });
        this.save();
    }
    save() {
        sketch.Settings.setSettingForKey('com.frontify.sketch.recent', this.recents);
    }
}
export default new RecentFiles();
