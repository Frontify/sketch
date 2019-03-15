import readJSON from '../helpers/readJSON'
import fetch from '../helpers/fetch'
import writeJSON from "../helpers/writeJSON";
import project from "./project";
import notification from "./notification";
import { isWebviewPresent, sendToWebview } from 'sketch-module-web-view/remote'

class Target {
    getTarget(view) {
        // load brand and project name
        var target = readJSON('target') || {};

        if (target.project) {
            var set = readJSON('set-' + target.project) || {};
            if (view == 'sources') {
                target.set = set.set_sources || 0;
            }
            else {
                target.set = set.set || 0;
            }
        }

        return fetch('/v1/info/target', {
            method: 'POST',
            body: JSON.stringify(target)
        }).then(function (result) {
            if (result.success == false) {
                return false;
            }

            delete result.success;

            result.path = '' + NSHomeDirectory() + '/Frontify/' + result.brand.name + '/Projects/' + result.project.name + result.set.path;
            return result;
        }.bind(this));
    }

    getSimpleTarget() {
        var target = readJSON('target');

        if (!target) {
            return Promise.resolve(false);
        }

        if (target.project) {
            var set = readJSON('set-' + target.project) || {};
            target.set = set.set || 0;
            target.set_sources = set.set_sources || 0;
        }

        return Promise.resolve(target);
    }

    getDomain() {
        var token = readJSON('token');

        if (token && token.domain) {
            return Promise.resolve(token.domain);
        }

        return Promise.resolve('https://app.frontify.com');
    }

    updateTarget(data) {
        return Promise.resolve().then(function () {
            var target = readJSON('target');

            // handle pusher channel subscription if project changes
            if(target.project >= 0 && data.project >= 0 && target.project != data.project) {
                notification.unsubscribe(target.project);
                notification.subscribe(data.project);
            }

            // update target
            if (data.brand >= 0) {
                target.brand = data.brand;
            }
            if (data.project >= 0) {
                target.project = data.project;
            }

            if (target.project) {
                var set = readJSON('set-' + target.project) || {};

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
        }.bind(this));
    }

    showTarget() {
        this.getTarget().then(function (data) {
            if (!data) {
                if (isWebviewPresent('frontifymain')) {
                    sendToWebview('frontifymain', 'showNoProjects()');
                }
            }
            else {
                if (data.target_changed) {
                    project.showFolderChooser();
                }

                // write target to JSON
                var target = readJSON('target') || {};
                target.brand = data.brand.id;
                target.project = data.project.id;
                writeJSON('target', target);

                if (isWebviewPresent('frontifymain')) {
                    sendToWebview('frontifymain', 'showTarget(' + JSON.stringify(data) + ')');
                }
            }
        }.bind(this));
    }
}

export default new Target();

