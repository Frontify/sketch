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

    getAssetSourcesForType(type) {
        return this.getSimpleTarget().then(function(target) {
            return fetch('/v1/brand/' + target.brand + '/projects').then(function (data) {
                if (data.success == false) {
                    return false;
                }

                var sources = [];
                var selection = readJSON('assetsources-' + target.brand ) || {};
                var selected = null;

                switch(type) {
                    case 'colors':
                        sources = data.data.styleguides || [];
                        break;
                    case 'typography':
                        sources = data.data.styleguides || [];
                        break;
                    case 'images':
                        sources = data.data.libraries.filter(function(library) {
                            return library.project_type == 'MEDIALIBRARY';
                        }.bind(this));
                        break;
                    case 'logos':
                        sources = data.data.libraries.filter(function(library) {
                            return library.project_type == 'LOGOLIBRARY';
                        }.bind(this));
                        break;
                    case 'icons':
                        sources = data.data.libraries.filter(function(library) {
                            return library.project_type == 'ICONLIBRARY';
                        }.bind(this));
                        break;
                }

                if(sources.length == 0) {
                    throw new Error('No asset sources found for type ' + type);
                }

                if(selection[type]) {
                    selected = sources.find(function(source) {
                        return source.id == selection[type].id;
                    }.bind(this));
                }

                if(!selected) {
                    selected = sources[0];
                }

                // set or refresh asset source
                return this.switchAssetSourceForType(type, selected).then(function() {
                    return { sources: sources, selected: selected, type: type };
                }.bind(this));
            }.bind(this));
        }.bind(this)).catch(function(e) {
            if (isWebviewPresent('frontifymain')) {
                this.getTarget().then(function(target) {
                    var data = target;
                    data.type = type;
                    sendToWebview('frontifymain', 'showBlankSlate(' + JSON.stringify(data) + ')');
                }.bind(this));
            }

            return null;
        }.bind(this));
    }

    getSelectedAssetSourceForType(type) {
        return this.getSimpleTarget().then(function(target) {
            var assetSources = readJSON('assetsources-' + target.brand ) || {};
            if(assetSources[type]) {
                return assetSources[type];
            }

            throw new TypeError('No selected source for type ' + type + ' found');
        }.bind(this)).catch(function(e) {
            console.error(e);
        });
    }

    switchAssetSourceForType(type, assetSource) {
        return this.getSimpleTarget().then(function(target) {
            // write new source id to JSON
            var assetSources = readJSON('assetsources-' + target.brand ) || {};
            assetSources[type] = assetSource;
            writeJSON('assetsources-' + target.brand, assetSources);

            return true;
        }.bind(this));
    }
}

export default new Target();

