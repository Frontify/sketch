const sketch = require('sketch');

class RecentFiles {
    constructor() {
        this.recents = this.get();
    }
    clear() {
        sketch.Settings.setSettingForKey('com.frontify.sketch.recent', []);
    }
    get() {
        return sketch.Settings.settingForKey('com.frontify.sketch.recent') || [];
    }
    push(entry = {}) {
        // Remove any existing items with the given ID
        this.recents = this.get().filter((item) => item.uuid != entry.uuid);

        // Move the entry to the front
        this.recents.unshift({ ...entry, timestamp: new Date().getTime() });
        this.save();
    }
    save() {
        sketch.Settings.setSettingForKey('com.frontify.sketch.recent', this.recents);
    }
}
export default new RecentFiles();
