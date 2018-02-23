import readJSON from '../helpers/readJSON'
import fetch from '../helpers/fetch'
import writeJSON from "../helpers/writeJSON";
import project from "./project";

class Target {
    constructor() {
        this.context = null;
    }

    setContext(context) {
        this.context = context;
    }

    getTarget(view) {
        // load brand and project name
        var target = readJSON(this.context, 'target');

        if(view == 'sources') {
            target.set = target.set_sources;
        }

        return fetch(this.context, '/v1/info/target', {
            method: 'POST',
            body: JSON.stringify(target)
        }).then(function (result) {
            if (result.target_changed || result.success == false) {
                return false;
            }

            delete result.success;

            result.path = '' + NSHomeDirectory() + '/Frontify/' + result.brand.name + '/' + result.project.name + result.set.path;
            return result;
        }.bind(this));
    }

    getSimpleTarget() {
        var target = readJSON(this.context, 'target');

        if (!target) {
            return Promise.resolve(false);
        }

        return Promise.resolve(target);
    }

    getDomain() {
        var token = readJSON(this.context, 'token');

        if (token && token.domain) {
            return Promise.resolve(token.domain);
        }

        return Promise.resolve('https://app.frontify.com');
    }

    updateTarget(data) {
        return Promise.resolve().then(function() {
            var target = readJSON(this.context, 'target');
            if(data.brand >= 0) {
                target.brand = data.brand;
            }
            if(data.project >= 0) {
                target.project = data.project;
            }
            if(data.set >= 0) {
                target.set = data.set;
            }
            if(data.set_sources >= 0) {
               target.set_sources = data.set_sources;
            }

            writeJSON(this.context, 'target', target);

            return target;
        }.bind(this));
    }

    showTarget(ui) {
        this.getTarget().then(function (data) {
            if(!data) {
                project.showProjectChooser(ui);
            }
            else {
                // write target to JSON
                var target =  readJSON(this.context, 'target') || {};
                target.brand = data.brand.id;
                target.project = data.project.id;

                writeJSON(this.context, 'target', target);

                ui.eval('showTarget(' + JSON.stringify(data) + ')');
            }
        }.bind(this));
    }
}

export default new Target();

