import readJSON from '../helpers/readJSON';
import shaFile from '../helpers/shaFile';
import fetch from '../helpers/fetch';
import target from './target';
import sketch from './sketch';
import filemanager from './filemanager';

import recentFiles from '../model/recent';

import { isWebviewPresent, sendToWebview } from 'sketch-module-web-view/remote';

let sketch3 = require('sketch');

class Source {
    constructor() {}

    getRemoteAssetForProjectIDByAssetID(projectID, assetID) {
        console.log('getRemoteAssetForProjectIDByAssetID');
        // Ideally, this would be Infinity or we would use the global GraphQL endpoint …
        const depth = 999999999;
        return fetch(
            `/v1/assets/status/${projectID}?include_screen_activity=true&depth=${depth}&ext=sketch&id=${assetID}`
        ).then((result) => {
            console.log(result);
            if (result.assets != null) {
                // The API returns {assets} as an Object (?), and we’re interested in the first one
                // that matches the given ID.

                // TODO: It would be much better if we could query the API with a specific ID …
                let key = Object.keys(result.assets).find((key) => {
                    return result.assets[key].id == assetID;
                });
                return result.assets[key];
            } else {
                return false;
            }
        });
    }

    getLocalAndRemoteSourceFiles() {
        return target.getTarget('sources').then(
            function (target) {
                // load remote assets status
                return this.getRemoteSourceFiles().then(
                    function (assets) {
                        let sources = [];
                        // Here we get the cached information about the assets with their modified date etc.
                        let status = readJSON('sources-' + target.project.id) || { assets: {} };
                        let alreadyAdded = false;

                        // compare with local status
                        return this.getLocalSketchFiles(target.path).then(
                            function (files) {
                                assets.forEach(
                                    function (asset) {
                                        files.forEach(
                                            function (file) {
                                                if (file.filename == asset.filename) {
                                                    file.existing = true;

                                                    // force conflict if the asset has not been downloaded via plugin
                                                    status.assets[asset.id] = status.assets[asset.id] || {
                                                        id: asset.id,
                                                        modified: '0000-00-00 00:00:00',
                                                        sha: '0',
                                                    };

                                                    if (asset.sha == file.sha) {
                                                        // remote file and local file are the same
                                                        asset.state = 'same';
                                                    } else if (
                                                        file.sha != status.assets[asset.id].sha &&
                                                        asset.modified > status.assets[asset.id].modified
                                                    ) {
                                                        // there are local and remote changes
                                                        asset.state = 'conflict';
                                                    } else if (asset.modified > status.assets[asset.id].modified) {
                                                        // there is a newer version of this asset on frontify
                                                        asset.state = 'pull';
                                                    } else if (asset.modified <= status.assets[asset.id].modified) {
                                                        asset.state = 'push';
                                                    }

                                                    asset.current = file.current;

                                                    if (asset.current) {
                                                        alreadyAdded = true;
                                                    }
                                                }
                                            }.bind(this)
                                        );

                                        if (!asset.state) {
                                            asset.state = 'new';
                                        }

                                        sources.push(asset);
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

    getRemoteSourceFiles() {
        return target.getTarget('sources').then(
            function (target) {
                console.log('🎯 getRemoteSourceFiles', { target });
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

                        console.log('remote source files', assets);
                        return assets;
                    }.bind(this)
                );
            }.bind(this)
        );
    }

    getLocalSketchFiles(dir) {
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
                                    sha: shaFile(dir + '/' + filename),
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

    openSourceAtPath(path) {
        filemanager.openFile(path);
    }

    showSources() {
        return this.getLocalAndRemoteSourceFiles().then(
            function (data) {
                if (isWebviewPresent('frontifymain')) {
                    // MARK: Removed show sources event
                    // sendToWebview('frontifymain', 'showSources(' + JSON.stringify(data) + ')');
                }
                return true;
            }.bind(this)
        );
    }

    opened() {
        // Todo: Don’t rely on fetching data here but instead just open the file and resolve it
        sketch3.Settings.setDocumentSettingForKey(sketch.getDocument(), 'dirty', false);
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

    async saved() {
        let document = sketch3.Document.fromNative(sketch.getDocument());
        let nativeSketchDocument = sketch.getDocument();

        let refs = {
            remote_id: sketch3.Settings.documentSettingForKey(sketch.getDocument(), 'remote_id'),
            remote_project_id: sketch3.Settings.documentSettingForKey(sketch.getDocument(), 'remote_project_id'),
            remote_graphql_id: sketch3.Settings.documentSettingForKey(sketch.getDocument(), 'remote_graphql_id'),
        };

        let path = '' + nativeSketchDocument.fileURL().path();
        let filename = path.split('/');

        /**
         * Do we have the GraphQL ID? If not, let’s fetch it first.
         */
        console.log('id?', refs.remote_graphql_id);
        if (!refs.remote_graphql_id) {
            // fetch!
            console.log('fetch graphql id');
            let query = `{
                asset(id: ${refs.remote_id}) {
                  id
                  title
                  createdAt
                  creator {
                    name
                    email
                  }
                  modifiedAt
                  modifier {
                      name
                      email
                  }
                  ...on File {
                    downloadUrl
                  }
                  
                }
              }`;
            let url = `/graphql`;
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query.replace(/(\r\n|\n|\r)/gm, ''),
                }),
            };
            let response = await fetch(url, options);
            let id = response.data?.asset?.id;

            console.log('fetched id ', id);
            sketch3.Settings.setDocumentSettingForKey(sketch.getDocument(), 'remote_graphql_id', id);
            refs.remote_graphql_id = id;
        }

        console.log(refs);
        recentFiles.push({ uuid: document.id, path, filename: filename[filename.length - 1], refs });

        sketch3.Settings.setDocumentSettingForKey(sketch.getDocument(), 'dirty', true);

        return this.getCurrentAsset().then(async (asset) => {
            if (asset) {
                let sha = shaFile(asset.localpath);
                if (sha != asset.sha) {
                    console.log('🌀 Status Update');
                    let result = await fetch('/v1/screen/activity/' + asset.id, {
                        method: 'POST',
                        body: JSON.stringify({ activity: 'LOCAL_CHANGE' }),
                    });
                    console.log('updated', result);
                    return result;
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
            // MARK: Removed tracking of progress event
            // sendToWebview(
            //     'frontifymain',
            //     'sourceUploadProgress(' +
            //         JSON.stringify({
            //             id: options.id,
            //             id_external: options.id_external,
            //             progress: progress.fractionCompleted() * 100,
            //         }) +
            //         ')'
            // );
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
                        // sendToWebview('frontifymain', 'sourceDownloaded(' + JSON.stringify(source) + ')');
                    }

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
                console.log('🎯🎯🎯🎯🎯DOWNLOADED SOURCE');
                if (
                    path &&
                    source.current == true &&
                    NSDocumentController.sharedDocumentController().currentDocument()
                ) {
                    console.log('>>>>>OPEN FILE');
                    NSDocumentController.sharedDocumentController().currentDocument().close();
                    filemanager.openFile(path);
                }
            }.bind(this)
        );
    }

    pushSource(source, target) {
        let file = {
            path: target.path,
            filename: source.filename,
            name: source.filename,
            id: source.id,
            id_external: source.id,
            folder: target.set.path,
            project: target.project.id,
            type: 'source',
        };
        console.log('PUSH SOURCE', file, target);

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
                    if (isWebviewPresent('frontifymain')) {
                        // sendToWebview('frontifymain', 'sourceUploaded(' + JSON.stringify(file) + ')');
                    }

                    filemanager.updateAssetStatus(target.project.id, data);

                    return data;
                }.bind(this)
            )
            .catch(
                function (e) {
                    clearInterval(polling);
                    if (isWebviewPresent('frontifymain')) {
                        // sendToWebview('frontifymain', 'sourceUploadFailed(' + JSON.stringify(source) + ')');
                    }
                    return false;
                }.bind(this)
            );
    }

    addSource(source, target) {
        return new Promise((resolve, reject) => {
            console.log('>>> add source', source, target);
            try {
                let file = {
                    path: target.path,
                    filename: source.filename,
                    name: source.filename,
                    id: null,
                    id_external: source.id,
                    folder: target.set.path,
                    project: target.project.id,
                    type: 'source',
                };

                console.log('attempt to upload source to frontify', file);

                var sourceProgress = NSProgress.progressWithTotalUnitCount(100);

                var polling = setInterval(() => {
                    this.updateUploadProgress(file, sourceProgress);
                }, 100);

                filemanager
                    .uploadFile(file, sourceProgress)
                    .then((data) => {
                        clearInterval(polling);
                        data.modified = data.created;
                        filemanager.updateAssetStatus(target.project.id, data);

                        resolve(data);
                    })
                    .catch((error) => {
                        clearInterval(polling);
                        reject('source upload failed', error);
                    });
            } catch (error) {
                console.log(error);
            }
        });
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

    /**
     * Returns the Frontify "asset" for the current document.
     * The "asset" contains all the metadata from the API.
     * The filename is used, but maybe the ID would be better?
     * The problem of using the filename is that there could be multiple files
     * with the same name but in different folders …
     */

    getCurrentAsset() {
        let currentFilename = this.getCurrentFilename();
        return this.getRemoteSourceFiles().then(
            function (assets) {
                return assets.find(function (asset) {
                    console.log('matching', asset);
                    return asset.filename == currentFilename;
                });
            }.bind(this)
        );
    }
    /**
     * Returns the filename (e.g. Landing Page.sketch) of the current document.
     * The current document is the one that is currently open and focussed.
     *
     * The problem: We can only get the {path} from the Sketch API.
     * Thus, we need to split the path and extract the last part:
     */
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
