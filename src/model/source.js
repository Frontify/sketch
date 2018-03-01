import readJSON from '../helpers/readJSON'
import shaFile from '../helpers/shaFile'
import fetch from '../helpers/fetch'
import target from './target'
import filemanager from './filemanager'

class Source {
    constructor() {
        this.context = null;
    }

    setContext(context) {
        this.context = context;
    }

    getSources() {
        return target.getTarget('sources').then(function (target) {
            // load remote assets status
            return fetch('/v1/assets/status/' + target.project.id + '?depth=0&ext=sketch&path=' + encodeURIComponent(target.set.path)).then(function (result) {
                var assets = result.assets;
                var sources = [];
                var status = readJSON('sources-' + target.project.id) || { assets: {} };
                var alreadyAdded = false;

                // compare with local status
                return this.getFiles(target.path).then(function (files) {
                    for (var id in assets) {
                        if (assets.hasOwnProperty(id)) {
                            var asset = assets[id];
                            files.forEach(function (file) {
                                if (file.filename == asset.filename) {
                                    file.existing = true;

                                    // force conflict if the asset has not been downloaded via plugin
                                    status.assets[asset.id] = status.assets[asset.id] || { id: asset.id, modified: '0000-00-00 00:00:00', sha: '0' };

                                    if (asset.sha == file.sha) {
                                        // remote file and local file are the same
                                        asset.state = 'same';
                                    }
                                    else if(file.sha != status.assets[asset.id].sha && asset.modified > status.assets[asset.id].modified) {
                                        // there are local and remote changes
                                        asset.state = 'conflict';
                                    }
                                    else if (asset.modified > status.assets[asset.id].modified) {
                                        // there is a newer version of this asset on frontify
                                        asset.state = 'pull';
                                    }
                                    else if (asset.modified <= status.assets[asset.id].modified) {
                                        asset.state = 'push';
                                    }

                                    asset.current = file.current;

                                    if(asset.current) {
                                        alreadyAdded = true;
                                    }
                                }
                            }.bind(this));

                            if (!asset.state) {
                                asset.state = 'new';
                            }

                            sources.push(asset);
                        }
                    }

                    files.forEach(function (file) {
                        if (!file.existing) {
                            file.id = '' + NSUUID.UUID().UUIDString();
                            file.state = 'addable';
                            sources.push(file);
                        }
                    }.bind(this));

                    // sort (order: current, conflict, addable, new, sync, alphabetically
                    var states = ['conflict', 'addable', 'new', 'push', 'pull', 'same'];
                    sources.sort(function (a, b) {
                        var statea = states.indexOf(a.state);
                        var stateb = states.indexOf(b.state);

                        if (a.current) {
                            return -1;
                        }
                        else if (b.current) {
                            return 1;
                        }
                        else if (statea < stateb) {
                            return -1;
                        }
                        else if (statea > stateb) {
                            return 1;
                        }
                        else {
                            return a.filename < b.filename;
                        }
                    }.bind(this));


                    var data = {
                        sources: sources,
                        target: target,
                        already_added: alreadyAdded,
                        has_document: !!NSDocumentController.sharedDocumentController().currentDocument()
                    };

                    return data;
                }.bind(this));
            }.bind(this));
        }.bind(this));
    }

    getFiles(dir) {
        return Promise.resolve().then(function () {
            var files = [];
            var filenames = NSFileManager.defaultManager().contentsOfDirectoryAtPath_error(dir, null);

            var doc = NSDocumentController.sharedDocumentController().currentDocument();
            var currentFilename = '';

            if (doc && doc.fileURL()) {
                var nsurl = doc.fileURL();
                var path = '' + nsurl.path();
                var parts = path.split('/');
                currentFilename = parts.pop();
            }

            if (filenames) {
                filenames.forEach(function (filename) {
                    filename = '' + filename;
                    if (filename.endsWith('.sketch')) {
                        var file = {
                            ext: 'sketch',
                            filename: filename,
                            folder: dir,
                            path: '',
                            sha: shaFile(dir + '/' + filename)
                        };

                        if (filename == currentFilename) {
                            file.current = true;
                        }

                        files.push(file);
                    }
                }.bind(this));
            }

            return files;

        }.bind(this));
    }

    openSource(source) {
        return target.getTarget('sources').then(function (target) {
            var file = target.path + source.filename;
            filemanager.openFile(file);
            return true;
        }.bind(this))
    }

    showSources(ui) {
        return this.getSources().then(function (data) {
            ui.eval('showSources(' + JSON.stringify(data) + ')');
            return true;
        }.bind(this));
    }

    pushSource(ui, source) {
        return target.getTarget('sources').then(function (target) {

            // map source to file structure
            var file = {
                path: target.path + source.filename,
                folder_id: target.set.id,
                name: source.filename,
                id: source.id
            };

            return filemanager.uploadFile(file).then(function (data) {
                file.id = data.id;
                ui.eval('sourceUploaded(' + JSON.stringify(file) + ')');

                filemanager.updateAssetStatus(target.project.id, data);

                return true;
            }.bind(this));
        }.bind(this)).catch(function (err) {
            ui.eval('sourceUploadFailed(' + JSON.stringify(source) + ')');
            return true;
        }.bind(this));
    }

    addSource(ui, source) {
        return target.getTarget('sources').then(function (target) {

            // map source to file structure
            var file = {
                path: target.path + source.filename,
                folder_id: target.set.id,
                name: source.filename,
                id: null
            };

            return filemanager.uploadFile(file).then(function (data) {
                data.modified = data.created;
                filemanager.updateAssetStatus(target.project.id, data);

                // reload source file list
                return this.showSources(ui);
            }.bind(this));
        }.bind(this)).catch(function (err) {
            ui.eval('sourceUploadFailed(' + JSON.stringify(source) + ')');
            return true;
        }.bind(this));
    }

    addCurrentFile(ui) {
        if (!filemanager.isCurrentSaved()) {
            if (filemanager.saveCurrent()) {
                ui.eval('refresh()');
            }
        } else {
            if (filemanager.moveCurrent()) {
                ui.eval('refresh()');
                ui.eval('showSourcesHowTo()')
            }
        }
    }
}

export default new Source();

