import readJSON from '../helpers/readJSON';
import shaFile from '../helpers/shaFile';
import fetch from '../helpers/fetch';
import target from './target';
import sketch from './sketch';
import filemanager from './filemanager';
import user from './user';
import { isWebviewPresent, sendToWebview } from 'sketch-module-web-view/remote';

class Source {
    constructor() {}

    getSources() {
        return target.getTarget('sources').then(
            function (target) {
                // load remote assets status
                return this.getAssets().then(
                    function (assets) {
                        let sources = [];
                        let status = readJSON('sources-' + target.project.id) || { assets: {} };
                        let alreadyAdded = false;

                        // compare with local status
                        return this.getFiles(target.path).then(
                            function (files) {
                                assets.forEach(
                                    function (asset) {
                                        let local = status.assets[asset.id];
                                        let remote = asset;

                                        files.forEach(
                                            function (file) {
                                                if (file.filename == asset.filename) {
                                                    file.existing = true;

                                                    // force conflict if the asset has not been downloaded via plugin
                                                    status.assets[asset.id] = status.assets[asset.id] || {
                                                        id: asset.id,
                                                        modified: '0000-00-00 00:00:00',
                                                        modifier_email: '',
                                                        sha: '0',
                                                    };

                                                    user.getUser().then((user) => {
                                                        if (user && user.id) {
                                                            const sameUser =
                                                                local.modifier_email == remote.modifier_email;
                                                            const sameDate = remote.modified == local.modified;
                                                            const localChanges = local.sha !== file.sha;

                                                            if (sameUser && sameDate && !localChanges) {
                                                                remote.state = 'same';
                                                            } else if (
                                                                localChanges &&
                                                                remote.modified > local.modified
                                                            ) {
                                                                remote.state = 'conflict';
                                                            } else if (
                                                                !localChanges &&
                                                                remote.modified > local.modified
                                                            ) {
                                                                remote.state = 'pull';
                                                            } else if (remote.modified <= local.modified) {
                                                                remote.state = 'push';
                                                            }

                                                            remote.current = file.current;

                                                            if (remote.current) {
                                                                alreadyAdded = true;
                                                            }
                                                        }
                                                    });
                                                }
                                            }.bind(this)
                                        );

                                        if (!remote.state) {
                                            remote.state = 'new';
                                        }

                                        sources.push(remote);
                                    }.bind(this)
                                );

                                files.forEach(
                                    function (file) {
                                        if (!file.existing) {
                                            file.id = '' + NSUUID.UUID().UUIDString();
                                            file.state = 'addable';
                                            sources.push(file);
                                        }
                                    }.bind(this)
                                );

                                // sort (order: current, conflict, addable, new, sync, alphabetically
                                let states = ['conflict', 'addable', 'new', 'push', 'pull', 'same'];
                                sources.sort(
                                    function (a, b) {
                                        let statea = states.indexOf(a.state);
                                        let stateb = states.indexOf(b.state);

                                        if (a.current) {
                                            return -1;
                                        } else if (b.current) {
                                            return 1;
                                        } else if (statea < stateb) {
                                            return -1;
                                        } else if (statea > stateb) {
                                            return 1;
                                        } else {
                                            return a.filename < b.filename;
                                        }
                                    }.bind(this)
                                );

                                let data = {
                                    sources: sources,
                                    target: target,
                                    already_added: alreadyAdded,
                                    has_document: !!sketch.getDocument(),
                                };

                                return data;
                            }.bind(this)
                        );
                    }.bind(this)
                );
            }.bind(this)
        );
    }

    getAssets() {
        return target.getTarget('sources').then(
            function (target) {
                return fetch(
                    '/v1/assets/status/' +
                        target.project.id +
                        '?include_screen_activity=true&depth=0&ext=sketch&path=' +
                        encodeURIComponent(target.set.path)
                ).then(
                    function (result) {
                        let assets = [];
                        for (let id in result.assets) {
                            if (result.assets.hasOwnProperty(id)) {
                                let asset = result.assets[id];
                                asset.localpath = target.path + '/' + asset.filename;
                                assets.push(asset);
                            }
                        }

                        this.assets = assets;
                        return assets;
                    }.bind(this)
                );
            }.bind(this)
        );
    }

    getFiles(dir) {
        return Promise.resolve().then(
            function () {
                let files = [];
                let filenames = NSFileManager.defaultManager().contentsOfDirectoryAtPath_error(dir, null);

                let currentFilename = this.getCurrentFilename();

                if (filenames) {
                    filenames.forEach(
                        function (filename) {
                            filename = '' + filename;
                            if (filename.endsWith('.sketch')) {
                                let file = {
                                    ext: 'sketch',
                                    filename: filename,
                                    folder: dir,
                                    path: '',
                                    sha: '' + shaFile(dir + '/' + filename),
                                };

                                if (filename == currentFilename) {
                                    file.current = true;
                                }

                                files.push(file);
                            }
                        }.bind(this)
                    );
                }

                return files;
            }.bind(this)
        );
    }

    openSource(source) {
        return target.getTarget('sources').then(
            function (target) {
                let file = target.path + source.filename;
                filemanager.openFile(file);
                return true;
            }.bind(this)
        );
    }

    showSources() {
        return this.getSources().then(
            function (data) {
                if (isWebviewPresent('frontifymain')) {
                    sendToWebview('frontifymain', 'showSources(' + JSON.stringify(data) + ')');
                }
                return true;
            }.bind(this)
        );
    }

    opened() {
        return this.getCurrentAsset().then(function (asset) {
            if (asset) {
                return fetch('/v1/screen/activity/' + asset.id, {
                    method: 'POST',
                    body: JSON.stringify({ activity: 'OPEN' }),
                });
            }

            return null;
        });
    }

    saved() {
        return this.getCurrentAsset().then(function (asset) {
            if (asset) {
                let sha = shaFile(asset.localpath);

                if (sha != asset.sha) {
                    return fetch('/v1/screen/activity/' + asset.id, {
                        method: 'POST',
                        body: JSON.stringify({ activity: 'LOCAL_CHANGE' }),
                    });
                }
            }

            return null;
        });
    }

    closed() {
        return this.getCurrentAsset().then(function (asset) {
            if (asset) {
                return fetch('/v1/screen/activity/' + asset.id, {
                    method: 'DELETE',
                });
            }

            return null;
        });
    }

    updateUploadProgress(options, progress) {
        if (isWebviewPresent('frontifymain')) {
            sendToWebview(
                'frontifymain',
                'sourceUploadProgress(' +
                    JSON.stringify({
                        id: options.id,
                        id_external: options.id_external,
                        progress: progress.fractionCompleted() * 100,
                    }) +
                    ')'
            );
        }
    }

    updateDownloadProgress(options, progress) {
        if (isWebviewPresent('frontifymain')) {
            sendToWebview(
                'frontifymain',
                'sourceDownloadProgress(' +
                    JSON.stringify({
                        id: options.id,
                        id_external: options.id_external,
                        progress: progress.fractionCompleted() * 100,
                    }) +
                    ')'
            );
        }
    }

    downloadSource(source) {
        var sourceProgress = NSProgress.progressWithTotalUnitCount(10);
        sourceProgress.setCompletedUnitCount(0);

        var polling = setInterval(
            function () {
                this.updateDownloadProgress(source, sourceProgress);
            }.bind(this),
            100
        );

        return filemanager
            .downloadScreen({ id: source.id, filename: source.filename }, sourceProgress)
            .then(
                function (path) {
                    clearInterval(polling);

                    if (isWebviewPresent('frontifymain')) {
                        sendToWebview('frontifymain', 'sourceDownloaded(' + JSON.stringify(source) + ')');
                    }

                    source.sha = '' + shaFile(source.localpath);

                    target.getTarget('sources').then(function (target) {
                        filemanager.updateAssetStatus(target.project.id, source);
                    });

                    return path;
                }.bind(this)
            )
            .catch(
                function (e) {
                    clearInterval(polling);

                    if (isWebviewPresent('frontifymain')) {
                        sendToWebview('frontifymain', 'sourceDownloadFailed(' + JSON.stringify(source) + ')');
                    }

                    return null;
                }.bind(this)
            );
    }

    pullSource(source) {
        return this.downloadSource(source).then(
            function (path) {
                if (
                    path &&
                    source.current == true &&
                    NSDocumentController.sharedDocumentController().currentDocument()
                ) {
                    NSDocumentController.sharedDocumentController().currentDocument().close();
                    filemanager.openFile(path);
                }
            }.bind(this)
        );
    }

    pushSource(source) {
        return target.getTarget('sources').then(
            function (target) {
                // map source to file structure
                let file = {
                    path: target.path + source.filename,
                    filename: source.filename,
                    name: source.filename,
                    id: source.id,
                    id_external: source.id,
                    folder: target.set.path,
                    project: target.project.id,
                    type: 'source',
                };

                var sourceProgress = NSProgress.progressWithTotalUnitCount(10);
                sourceProgress.setCompletedUnitCount(0);

                var polling = setInterval(
                    function () {
                        this.updateUploadProgress(file, sourceProgress);
                    }.bind(this),
                    100
                );

                return filemanager
                    .uploadFile(file, sourceProgress)
                    .then(
                        function (data) {
                            clearInterval(polling);
                            file.id = data.id;

                            data.sha = '' + shaFile(file.path);

                            user.getUser().then(function (user) {
                                file.modifier_name = '' + user.name;
                                if (isWebviewPresent('frontifymain')) {
                                    sendToWebview('frontifymain', 'sourceUploaded(' + JSON.stringify(file) + ')');
                                }

                                data.modifier_email = '' + user.email;
                                data.modifier_name = '' + user.name;

                                filemanager.updateAssetStatus(target.project.id, data);
                                return true;
                            });
                        }.bind(this)
                    )
                    .catch(
                        function (e) {
                            clearInterval(polling);
                            if (isWebviewPresent('frontifymain')) {
                                sendToWebview('frontifymain', 'sourceUploadFailed(' + JSON.stringify(source) + ')');
                            }
                            return true;
                        }.bind(this)
                    );
            }.bind(this)
        );
    }

    addSource(source) {
        return target.getTarget('sources').then(
            function (target) {
                // map source to file structure
                let file = {
                    path: target.path + source.filename,
                    filename: source.filename,
                    name: source.filename,
                    id: null,
                    id_external: source.id,
                    folder: target.set.path,
                    project: target.project.id,
                    type: 'source',
                };

                var sourceProgress = NSProgress.progressWithTotalUnitCount(100);

                var polling = setInterval(
                    function () {
                        this.updateUploadProgress(file, sourceProgress);
                    }.bind(this),
                    100
                );

                return filemanager
                    .uploadFile(file, sourceProgress)
                    .then(
                        function (data) {
                            clearInterval(polling);
                            data.modified = data.created;

                            data.sha = '' + shaFile(file.path);

                            user.getUser().then(function (user) {
                                data.modifier_email = '' + user.email;
                                data.modifier_name = '' + user.name;
                                filemanager.updateAssetStatus(target.project.id, data);
                                return true;
                            });

                            // reload source file list
                            return this.showSources();
                        }.bind(this)
                    )
                    .catch(
                        function (e) {
                            clearInterval(polling);
                            if (isWebviewPresent('frontifymain')) {
                                sendToWebview('frontifymain', 'sourceUploadFailed(' + JSON.stringify(source) + ')');
                            }
                            return true;
                        }.bind(this)
                    );
            }.bind(this)
        );
    }

    addCurrentFile() {
        if (!filemanager.isCurrentSaved()) {
            if (filemanager.saveCurrent()) {
                if (isWebviewPresent('frontifymain')) {
                    sendToWebview('frontifymain', 'refresh()');
                }
            }
        } else {
            if (isWebviewPresent('frontifymain')) {
                sendToWebview('frontifymain', 'showSourcesHowTo()');
            }
        }
    }

    getCurrentAsset() {
        let currentFilename = this.getCurrentFilename();
        return this.getAssets().then(
            function (assets) {
                return assets.find(function (asset) {
                    return asset.filename == currentFilename;
                });
            }.bind(this)
        );
    }

    getCurrentFilename() {
        let doc = sketch.getDocument();
        let currentFilename = '';

        if (doc && doc.fileURL()) {
            let nsurl = doc.fileURL();
            let path = '' + nsurl.path();
            let parts = path.split('/');
            currentFilename = parts.pop();
        }

        return currentFilename;
    }
}

export default new Source();
