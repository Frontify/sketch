import readJSON from '../helpers/readJSON';
import shaFile from '../helpers/shaFile';
import fetch from '../helpers/fetch';
import target from './target';
import sketch from './sketch';
import filemanager from './filemanager';
import createFolder from '../helpers/createFolder';

// Message helper
import { frontend } from '../helpers/ipc';

import recentFiles from '../model/recent';

import { isWebviewPresent, sendToWebview } from 'sketch-module-web-view/remote';

let sketch3 = require('sketch');
let Document = require('sketch/dom').Document;

class Source {
    constructor() {}

    async getRemoteAssetForProjectIDByAssetID(projectID, assetID) {
        /**
         * Warning:
         *
         * This API call will not return files of the same filename.
         *
         * So if you have ABC.sketch and another ABC.sketch in the same folder on Frontify,
         * only one will be returned.
         */

        // Ideally, this would be Infinity or we would use the global GraphQL endpoint …
        const depth = 999999999;
        let result = await fetch(
            `/v1/assets/status/${projectID}?include_screen_activity=true&depth=${depth}&ext=sketch&id=${assetID}`
        );

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
    }

    openSourceAtPath(path) {
        filemanager.openFile(path);
    }

    opened() {
        console.log('opened');
        frontend.send('document-opened');
        // Todo: Don’t rely on fetching data here but instead just open the file and resolve it

        sketch3.Settings.setDocumentSettingForKey(sketch.getDocument(), 'dirty', false);
        this.pushRecent();

        // ‼️ Temporarily disabled Pusher

        return new Promise((resolve, reject) => {
            resolve();
        });

        // return this.getCurrentAsset().then(function (asset) {
        //     if (asset) {
        //         return fetch('/v1/screen/activity/' + asset.id, {
        //             method: 'POST',
        //             body: JSON.stringify({ activity: 'OPEN' }),
        //         });
        //     }

        //     return null;
        // });
    }

    async getAssetForAssetID(assetID) {
        // fetch!

        let query = `{
            asset: node(id: "${assetID}") {
                __typename
              id
              ...on File {
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

        return response.data?.asset;
    }

    async getAssetForLegacyAssetID(assetID) {
        // fetch!

        let query = `{
        asset(id: ${assetID}) {
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
        return response.data?.asset;
    }

    async getGraphQLIDForLegacyAssetID(assetID) {
        // fetch!

        let query = `{
        asset(id: ${assetID}) {
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
        return response.data?.asset?.id;
    }
    async pushRecent() {
        let document = sketch3.Document.fromNative(sketch.getDocument());
        let nativeSketchDocument = sketch.getDocument();

        let refs = {
            remote_id: sketch3.Settings.documentSettingForKey(sketch.getDocument(), 'remote_id'),
            remote_project_id: sketch3.Settings.documentSettingForKey(sketch.getDocument(), 'remote_project_id'),
            remote_graphql_id: sketch3.Settings.documentSettingForKey(sketch.getDocument(), 'remote_graphql_id'),
            remote_brand_id: sketch3.Settings.documentSettingForKey(sketch.getDocument(), 'remote_brand_id'),
        };

        /**
         * Do we have the GraphQL ID? If not, let’s fetch it first.
         */

        if (!refs.remote_graphql_id || typeof refs.remote_graphql_id != 'string') {
            let id = await this.getGraphQLIDForLegacyAssetID(refs.remote_id);

            sketch3.Settings.setDocumentSettingForKey(sketch.getDocument(), 'remote_graphql_id', id);
            refs.remote_graphql_id = id;
        }

        if (nativeSketchDocument && nativeSketchDocument.fileURL()) {
            let base = target.getPathToSyncFolder();
            let path = '' + nativeSketchDocument.fileURL().path();
            let filename = path.split('/');
            let relativePath = path.replace(base + '/', '');

            recentFiles.push({
                uuid: document.id,
                path,
                relativePath,
                filename: filename[filename.length - 1],
                localModifiedFromRemote: sketch3.Settings.documentSettingForKey(
                    sketch.getDocument(),
                    'remote_modified'
                ),
                refs,
            });
        }
    }
    getRelativePath(path) {
        if (!path) return null;
        let base = target.getPathToSyncFolder();

        let relativePath = `/${path.replace(base, '').split('/').splice(3).join('/')}`;

        return relativePath;
    }
    async saved(context) {
        let nativeDocument = context.actionContext.document;
        let wrappedDocument = sketch3.Document.fromNative(context.actionContext.document);

        // Is this asset tracked?
        let database = filemanager.getAssetDatabaseFile();
        let isTracked =
            sketch3.Settings.documentSettingForKey(wrappedDocument, 'remote_id') || database[wrappedDocument.id];

        // Return early
        if (!isTracked) {
            // Inform the UI that a file has been saved, even though it is untracked.
            // Then, we can refresh the list of open documents.
            frontend.send('document-saved');
            return;
        }

        let filePath = '' + nativeDocument.fileURL().path();
        let filename = filePath.split('/');
        filename = filename[filename.length - 1];

        let sha = '' + shaFile(filePath);

        this.pushRecent();

        await filemanager.refreshAsset(wrappedDocument.id);

        filemanager.updateAssetDatabase({
            action: 'saved',
            filename: filename,
            uuid: wrappedDocument.id,
            sha: sha,
            saved: { sha: sha, timestamp: '' + new Date().toISOString() },
            dirty: true,
            path: filePath,
            relativePath: this.getRelativePath(filePath),
        });

        // Mark as dirty, so that it can be pushed
        sketch3.Settings.setDocumentSettingForKey(sketch.getDocument(), 'dirty', true);

        frontend.send('document-saved');

        // ‼️ Temporarily disabled Pusher

        return new Promise((resolve, reject) => {
            resolve();
        });

        // return this.getCurrentAsset().then(async (asset) => {
        //     if (asset) {
        //         if (sha != asset.sha) {
        //             let result = await fetch('/v1/screen/activity/' + asset.id, {
        //                 method: 'POST',
        //                 body: JSON.stringify({ activity: 'LOCAL_CHANGE' }),
        //             });

        //             return result;
        //         }
        //     }

        //     return null;
        // });
    }

    closed() {
        frontend.send('document-closed');

        // ‼️ Temporarily disabled Pusher

        return new Promise((resolve, reject) => {
            resolve();
        });

        // return this.getCurrentAsset().then(function (asset) {
        //     if (asset) {
        //         return fetch('/v1/screen/activity/' + asset.id, {
        //             method: 'DELETE',
        //         });
        //     }

        //     return null;
        // });
    }

    updateUploadProgress(options, progress) {
        if (isWebviewPresent('frontifymain')) {
            // progress, id, id_external
            frontend.send('progress', { state: 'uploading', progress: progress.fractionCompleted() * 100, ...options });
        }
    }

    updateDownloadProgress(options, progress) {
        if (isWebviewPresent('frontifymain')) {
            // progress, id, id_external
            frontend.send('progress', {
                state: 'downloading',
                progress: progress.fractionCompleted() * 100,
                ...options,
            });
        }
    }

    downloadSource(source, path) {
        var sourceProgress = NSProgress.progressWithTotalUnitCount(10);
        sourceProgress.setCompletedUnitCount(0);

        var polling = setInterval(
            function () {
                this.updateDownloadProgress(source, sourceProgress);
            }.bind(this),
            100
        );

        let uri = `/v1/screen/download/${source.id}`;

        return filemanager
            .downloadFile(uri, path, sourceProgress)
            .then(
                function (path) {
                    if (path == null) {
                        return null;
                    }
                    clearInterval(polling);

                    if (isWebviewPresent('frontifymain')) {
                        frontend.send('source-downloaded', { source });
                    }

                    return path;
                }.bind(this)
            )
            .catch(
                function (e) {
                    clearInterval(polling);

                    if (isWebviewPresent('frontifymain')) {
                        frontend.send('source-download-failed', { source });
                    }
                    console.error('Source download failed', e);

                    return null;
                }.bind(this)
            );
    }
    /**
     * Check out a source file from remote.
     *
     * Expects a GraphQL {id}
     *
     */
    checkoutSource(source, path) {
        // Path formatting

        let filename = path.split('/');
        filename = filename[filename.length - 1];

        filemanager.updateAssetDatabase({
            action: 'pulled',
            filename: filename,
            uuid: source.id_external,
            sha: source.sha,
            pulled: { sha: source.sha, timestamp: '' + new Date().toISOString() },
            previous: {
                sha: source.sha,
                modifiedAt: source.remote.modifiedAt,
            },
            dirty: false,
            path: path,
            relativePath: this.getRelativePath(path),
            remote: source.remote,
            refs: {
                remote_id: source.id,
            },
            state: 'same',
        });
    }

    /**
     * Pull a source file from remote.
     *
     * Expects a legacy {id}
     *
     */
    async pullSource(source, path) {
        return this.downloadSource(source, path).then(async (path) => {
            // downloaded

            return path;
        });
    }

    async openSketchFile(path) {
        let fileToOpen = path;

        let doc = await new Promise((resolve, reject) => {
            try {
                Document.open(fileToOpen, function (err, document) {
                    if (err) {
                        console.error(err);
                        reject(err);
                    }
                    resolve(document);
                });
            } catch (error) {
                console.error(error);
                reject(error);
            }
        });

        return doc;
    }

    pushSource(source, target) {
        let file = {
            path: target.path,
            filename: source.filename,
            name: source.filename,
            id: source.refs.remote_id,
            id_external: source.uuid,
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
            .then(async (data) => {
                // Payload of the response: {filesize, id, ext, modifier, filename, type, sha, modified, token}

                /**
                 * Legacy date format:  2022-07-20 12:45:52
                 * New date format:     2022-07-20T12:45:53.000+00:00
                 *
                 * Notice the slight difference: the "modifiedAt" returned from GraphQL is 1 second newer.
                 * We can assume that the time difference between the legacy and new date could be even bigger
                 * if the processing time takes longer or so.
                 *
                 * Although the upload is done through the legacy API v1, further requests to get data go through GraphQL.
                 * That means that if we want to reliably compare timestamps, we should get them from the same source.
                 *
                 * That’s why here, we’ll request the data from GraphQL and copy the "modifiedAt" field to the file.
                 */
                let dataFromGraphQL = await this.getAssetForLegacyAssetID(data.id);
                data.modifiedAt = dataFromGraphQL.modifiedAt;

                clearInterval(polling);
                file.id = data.id;
                if (isWebviewPresent('frontifymain')) {
                    frontend.send('progress', {
                        state: 'upload-complete',
                        status: 'upload-complete',
                        ...file,
                    });
                }

                filemanager.updateAssetStatus(target.project.id, data);

                let sha = '' + shaFile(file.path);

                filemanager.updateAssetDatabase({
                    action: 'pushed',
                    uuid: file.id_external,
                    sha: sha,
                    dirty: false,
                    previous: {
                        sha,
                        modifiedAt: dataFromGraphQL.modifiedAt,
                    },
                    pushed: { sha, timestamp: '' + new Date().toISOString() },
                    remote: {
                        ...data,
                    },
                });

                return data;
            })
            .catch(
                function (e) {
                    clearInterval(polling);
                    if (isWebviewPresent('frontifymain')) {
                        frontend.send('progress', {
                            state: 'upload-failed',
                            ...file,
                        });
                    }
                    return false;
                }.bind(this)
            );
    }

    addSource(source, uploadTarget) {
        return new Promise((resolve, reject) => {
            try {
                let file = {
                    path: uploadTarget.path,
                    filename: source.filename,
                    name: source.filename,
                    id: null,
                    id_external: source.uuid, // source id is the Sketch ID
                    folder: uploadTarget.set.path,
                    project: uploadTarget.project.id,
                    type: 'source',
                };

                var sourceProgress = NSProgress.progressWithTotalUnitCount(100);

                var polling = setInterval(() => {
                    this.updateUploadProgress(file, sourceProgress);
                }, 100);

                // This will be the new location of the file
                let filePath = uploadTarget.path + source.filename;

                console.log('pass it on to filemanager', file);
                filemanager
                    .uploadFile(file, sourceProgress)
                    .then(async (data) => {
                        console.log('then');
                        clearInterval(polling);
                        data.modified = data.created;
                        // filemanager.updateAssetStatus(target.project.id, data);

                        let dataFromGraphQL = await this.getAssetForLegacyAssetID(data.id);
                        let sha = '' + shaFile(file.path);
                        filemanager.updateAssetDatabase({
                            action: 'added',
                            dirty: false,
                            id: data.id,
                            filename: source.filename,
                            path: uploadTarget.path,
                            uuid: source.uuid,
                            relativePath: uploadTarget.path,
                            previous: {
                                modifiedAt: dataFromGraphQL.modifiedAt,
                                sha,
                            },
                            remote: dataFromGraphQL,
                            added: {
                                sha,
                            },
                            refs: {
                                remote_id: data.id,
                                remote_project_id: uploadTarget.project.id,
                            },
                        });

                        if (isWebviewPresent('frontifymain')) {
                            frontend.send('progress', {
                                status: 'upload-complete',
                                ...file,
                            });
                        }

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
            console.log('Hmm… can’t add current file because it isn’t saved.');
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
        console.log('get current asset');
        let currentFilename = this.getCurrentFilename();

        return this.getRemoteSourceFiles().then(
            function (assets) {
                if (!assets) return null;
                return assets.find(function (asset) {
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
