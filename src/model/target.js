// Models
import Notification from './notification';

// Helpers
import readJSON from '../helpers/readJSON';
import fetch from '../helpers/fetch';
import writeJSON from '../helpers/writeJSON';

class Target {
    readTarget() {
        return readJSON('target') || {};
    }
    writeTarget(value) {
        writeJSON('target', value);
    }
    getValueForKey(key) {
        let target = this.readTarget();
        return target[key];
    }
    setValueForKey(key, value) {
        let target = this.readTarget();
        target[key] = value;
        this.writeTarget(target);
    }
    setBrand(brandID) {
        this.setValueForKey('brand', brandID);
    }
    getBrand() {
        this.getValueForKey('brand');
    }

    getPathToSyncFolder() {
        return `${NSHomeDirectory()}/Frontify`;
    }
    getPathToSyncFolderForBrandAndProject(brand, project) {
        return `${NSHomeDirectory()}/Frontify/${brand.name}/Projects/${project.name}`;
    }

    getTarget(view) {
        // load brand and project name
        let target = readJSON('target') || {};

        if (target.project) {
            let set = readJSON('set-' + target.project) || {};

            if (view == 'sources') {
                target.set = set.set_sources || 0;
            } else {
                target.set = set.set || 0;
            }
        }

        return fetch('/v1/info/target', {
            method: 'POST',
            body: JSON.stringify(target),
        })
            .then(
                function (result) {
                    if (result.success == false) {
                        return false;
                    }

                    delete result.success;

                    result.path =
                        '' +
                        NSHomeDirectory() +
                        '/Frontify/' +
                        result.brand.name +
                        '/Projects/' +
                        result.project.name +
                        result.set.path;
                    return result;
                }.bind(this)
            )
            .catch((error) => {
                console.error(error);
            });
    }

    getDomain() {
        let target = readJSON('target');

        if (target && target.domain) {
            return Promise.resolve(target.domain);
        }

        return Promise.resolve('https://app.frontify.com');
    }

    updateTarget(data) {
        return Promise.resolve().then(
            function () {
                let target = readJSON('target');

                // handle pusher channel subscription if project changes
                if (target.project >= 0 && data.project >= 0 && target.project != data.project) {
                    Notification.unsubscribe(target.project);
                    Notification.subscribe(data.project);
                }

                // update target
                if (data.brand >= 0) {
                    target.brand = data.brand;
                }
                if (data.project >= 0) {
                    target.project = data.project;
                }

                if (target.project) {
                    let set = readJSON('set-' + target.project) || {};

                    if (data.set >= 0) {
                        set.set = data.set;
                    }
                    if (data.set_sources >= 0) {
                        set.set_sources = data.set_sources;
                    }

                    writeJSON('set-' + target.project, set);
                }

                writeJSON('target', target);

                return target;
            }.bind(this)
        );
    }
}

export default new Target();
