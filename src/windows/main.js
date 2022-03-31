import BrowserWindow from 'sketch-module-web-view';
import artboard from '../model/artboard';
import project from '../model/project';
import filemanager from '../model/filemanager';
import OAuth from '../model/oauth';
import source from '../model/source';
import target from '../model/target';
import sketch from '../model/sketch';
import color from '../model/color';
import typography from '../model/typography';
import asset from '../model/asset';
import user from '../model/user';
import createFolder from '../helpers/createFolder';
import shaFile from '../helpers/shaFile';

import recentFiles from '../model/recent';

import { sendToWebview } from 'sketch-module-web-view/remote';

let DOM = require('sketch/dom');
let sketch3 = require('sketch');

export function getPluginState() {
    let payload = {
        currentDocument: null,
        recentDocuments: recentFiles.get(),
        localDocuments: [],
    };
    return payload;
}

// Identifier for the plugin window that we can use for message passing
const IDENTIFIER = 'frontifymain';

// Dev/Prod switch that we can use to point the webview to different URLs
const isDev = process.env.NODE_ENV == 'development';

let threadDictionary = NSThread.mainThread().threadDictionary();

// We can use this method to construct the file path to our entry
// HTML file which will be a static asset within the plugin bundle.
// The code is copied from the @skpm/sketch-module-web-view which usually
// does that transformation but needs "require()" to do so. Since we’re
// building with Vite and not Webpack, this seemed necessary.
function pathInsidePluginBundle(url) {
    return `file://${
        context.scriptPath.split('.sketchplugin/Contents/Sketch')[0]
    }.sketchplugin/Contents/Resources/${url}`;
}

/**
 * We can use this helper to make it more convenient to send messages to the webview.
 */
const frontend = {
    send(type, payload) {
        console.log('send to frontend', type, payload);
        sendToWebview(IDENTIFIER, `send(${JSON.stringify({ type, payload })})`);
    },
};

export const state = {
    foo: 'bar',
};

state.foo = 'yo';

function refresh() {
    /**
     * Gather environment data
     *
     * 1. Current Document
     * 2. Recent Document
     * 3. Local Documents
     *
     */

    let payload = getPluginState();

    frontend.send('refresh', payload);
}

/**
 * Setup notification when the current document window changes
 */

// var fiber = require('sketch/async').createFiber();

// let center = NSNotificationCenter.defaultCenter();
// let block = __mocha__.createBlock_function('v16@?0@"NSNotification"8', function (notification) {
//     sketch3.UI.message('changed focus');
//     let currentDocument = Document.fromNative(sketch.getDocument());
//     if (currentDocument) {
//         frontend.send('current-document.changed', { currentDocument });
//     }
//     fiber.cleanup();
// });
// center.addObserverForName_object_queue_usingBlock('NSWindowDidBecomeKeyNotification', null, null, block);

// setTimeout(function () {
//     sketch3.UI.message('timed out');
//     fiber.cleanup();
// }, 3000);

export default function (context, view) {
    let viewData = sketch.getViewData();

    // viewData.url -> depending on the authorization state, returns "/" or "/signin"
    let baseURL = isDev ? 'http://localhost:3000' : pathInsidePluginBundle('index.html');
    let mainURL = `${baseURL}${viewData.url}`;

    let domain = '';

    // create window and webview
    let win = new BrowserWindow({
        alwaysOnTop: true,
        fullscreenable: false,
        hidesOnDeactivate: false,
        identifier: IDENTIFIER,
        maximizable: false,
        minHeight: 500,
        minimizable: false,
        minWidth: 400,
        remembersWindowFrame: true,
        resizable: true,
        show: false,
        title: 'Frontify',
    });

    let webview = win.webContents;
    // Load initial url

    /**
     * Here, we used to load viewData.url, but I don’t understand where that URL comes from.
     * Is it the previously seen URL and we use it to restore the most recent view that the user
     * has seen? For now, the mainURL will be loaded which will be the entry point for React.
     */

    // webview.loadURL(viewData.url);
    console.log('Sketch, load: ', mainURL);
    webview.loadURL(mainURL);

    // Show window if ready
    win.once('ready-to-show', () => {
        console.log('👋 Frontify Plugin is now running. NODE_ENV: ', process.env.NODE_ENV);
        win.show();
    });

    webview.on('cancelOauthFlow', () => {
        OAuth.cancelAuthorizationPolling();
    });

    webview.on('beginOauthFlow', (domain) => {
        OAuth.authorize(domain).then((authData) => {
            if (authData.hasError) {
                console.log(authData.error);
                return;
            }
            console.log('successfully authenticated', authData);

            user.login({
                access_token: authData.accessToken,
                domain: domain,
            }).then(
                function () {
                    // I guess this re-starts the plugin, which will then have the access token available?
                    frontend.send('user.authentication', { access_token: authData.accessToken, domain: domain });
                    // runCommand(context);
                }.bind(this)
            );
        });
    });

    // Load tab if webview ready
    webview.on('did-finish-load', () => {});

    webview.on('did-fail-load', () => {
        console.log('did-fail-load', err);
    });

    webview.on('nativeLog', function (s) {
        sketch.UI.message(s);

        return 'result';
    });

    win.on(
        'close',
        function () {
            threadDictionary.removeObjectForKey('frontifywindow');
        }.bind(this)
    );

    // Handlers called from webview
    webview.on('logout', function () {
        user.logout().then();
    });

    webview.on('memorizeDomain', function (url) {
        domain = url;
    });

    webview.on('showArtboards', function (skipRemote) {
        skipRemote = skipRemote || false;
        view = 'artboards';
        artboard.showArtboards(skipRemote);
    });

    webview.on('showSources', function () {
        view = 'sources';
        source.showSources();
    });

    webview.on('uploadArtboard', (data) => {
        artboard.uploadArtboards([data]);
    });

    webview.on('uploadArtboards', function (data) {
        artboard.uploadArtboards(data).then(
            function () {
                webview.executeJavaScript('artboardsUploaded()');
            }.bind(this)
        );
    });

    webview.on('switchAssetSourceForType', function (type, assetSourceId) {
        target.getAssetSourcesForType(type).then(
            function (data) {
                if (data && data.sources) {
                    let selected = data.sources.find(
                        function (source) {
                            return source.id == assetSourceId;
                        }.bind(this)
                    );

                    if (selected) {
                        target.switchAssetSourceForType(type, selected).then(
                            function () {
                                webview.executeJavaScript('refresh()');
                            }.bind(this)
                        );
                    }
                }
            }.bind(this)
        );
    });

    webview.on('openUrl', function (url, absolute) {
        if (absolute) {
            NSWorkspace.sharedWorkspace().openURL(NSURL.URLWithString(url));
        } else {
            target.getDomain().then(
                function (data) {
                    NSWorkspace.sharedWorkspace().openURL(NSURL.URLWithString(data + url));
                }.bind(this)
            );
        }
    });

    webview.on('openFinder', function () {
        target.getTarget('sources').then(
            function (data) {
                if (createFolder(data.path)) {
                    NSWorkspace.sharedWorkspace().openFile(data.path);
                }
            }.bind(this)
        );
    });

    webview.on('changeProject', function () {
        return project.showProjectChooser();
    });

    webview.on('projectSelected', function (data) {
        target.updateTarget(data).then(
            function () {
                target.showTarget();
                webview.executeJavaScript('refresh()');
            }.bind(this)
        );
    });

    webview.on('changeFolder', function (set) {
        project.showFolderChooser(set, view);
    });

    webview.on('folderSelected', function (set) {
        if (view == 'artboards') {
            target.updateTarget({ set: set }).then(
                function () {
                    artboard.showArtboards();
                }.bind(this)
            );
        } else if (view == 'sources') {
            target.updateTarget({ set_sources: set }).then(
                function () {
                    source.showSources();
                }.bind(this)
            );
        }
    });

    webview.on('addFolder', function (name, set) {
        project.addFolder(name, set).then(
            function () {
                project.showFolderChooser(set, view);
            }.bind(this)
        );
    });

    webview.on('openSource', function (data) {
        source.openSource(data);
    });

    webview.on('downloadSource', function (data) {
        source.downloadSource(data);
    });

    webview.on('pushSource', function (data) {
        source.pushSource(data);
    });

    webview.on('pullSource', function (data) {
        source.pullSource(data);
    });

    webview.on('addSource', function (data) {
        source.addSource(data);
    });

    webview.on('addCurrentFile', function () {
        source.addCurrentFile();
    });

    webview.on('moveCurrentFile', function () {
        if (filemanager.moveCurrent()) {
            webview.executeJavaScript('refresh()');
        }
    });

    webview.on('resolveConflict', function (id) {
        webview.executeJavaScript('showSourcesConflict(' + id + ')');
    });

    webview.on('showColors', function () {
        view = 'colors';
        color.showColors();
    });

    webview.on('applyColor', (data) => {
        color.applyColor(data);
    });

    webview.on('addDocumentColors', function (colors) {
        color.addDocumentColors(colors);
    });

    webview.on('replaceDocumentColors', function (colors) {
        color.replaceDocumentColors(colors);
    });

    webview.on('addGlobalColors', function (colors) {
        color.addGlobalColors(colors);
    });

    webview.on('replaceGlobalColors', function (colors) {
        color.replaceGlobalColors(colors);
    });

    webview.on('showTypography', function () {
        view = 'typography';
        typography.showTypography();
    });

    webview.on('addFontStyles', function (styles) {
        typography.addFontStyles(styles);
    });

    webview.on('applyFontStyle', function (style) {
        typography.applyFontStyle(style);
    });

    webview.on('downloadFonts', function () {
        typography.downloadFonts();
    });

    webview.on('online', function () {
        target.showTarget();
        webview.executeJavaScript('switchTab("' + view + '")');
    });

    webview.on('reload', function () {
        webview.reload();
    });
    // Images, Logos and Icons
    webview.on('showLibrary', function (type) {
        view = type;
        target.getAssetSourcesForType(type).then(
            function (assetSources) {
                if (assetSources && assetSources.selected) {
                    webview.executeJavaScript('showAssetSources(' + JSON.stringify(assetSources) + ')');
                    webview.executeJavaScript('showLibrarySearch("' + type + '")');
                    asset.search(type, '');
                }
            }.bind(this)
        );
    });

    webview.on('searchLibraryAssets', function (type, query) {
        asset.search(type, query);
    });

    /**
     *
     * @returns Requests that can be received from the Frontend
     */
    webview.off('request', handleRequestFromFrontend);
    webview.on('request', handleRequestFromFrontend);

    async function handleRequestFromFrontend({ type = '', requestUUID = null, args = {} }) {
        let payload = {};
        console.log('request!', new Date().getTime(), type, args);
        switch (type) {
            case 'addCurrentFile':
                try {
                    await source.addCurrentFile();
                    payload = { success: true };
                } catch (error) {
                    payload = { success: false, error };
                }
                break;
            case 'addSource':
                try {
                    let response = await source.addSource(args.source, args.target);
                    console.log('add source >>', response);
                    if (response.id) {
                        // Set Asset ID, saved inside the Sketch File
                        sketch3.Settings.setDocumentSettingForKey(sketch.getDocument(), 'remote_id', response.id);

                        // Set Project ID, saved inside the Sketch File
                        sketch3.Settings.setDocumentSettingForKey(
                            sketch.getDocument(),
                            'remote_project_id',
                            args.target.project.id
                        );
                    }
                    payload = { success: true, response };
                } catch (error) {
                    payload = { success: false, error };
                }
                break;
            case 'applyFontStyleWithColor':
                try {
                    await typography.applyFontStyle(args.textStyle, args.color);
                    payload = { sucess: 'true' };
                } catch (error) {
                    payload = { sucess: 'false' };
                }
                break;
            case 'applyLibraryAsset':
                try {
                    await asset.applyImage(args.asset);
                    // -> Message that we’re done
                    payload = { sucess: 'true' };
                } catch (error) {
                    console.log(error);
                    payload = { status: 'error' };
                }
                break;
            case 'checkout':
                try {
                    /**
                     * Step 1: Download the file to the Sync Folder.
                     */
                    var progress = NSProgress.progressWithTotalUnitCount(10);
                    progress.setCompletedUnitCount(0);
                    console.log('start download', args);

                    // Base + File Path
                    let base = target.getPathToSyncFolder();
                    let folder = `${base}/${args.path}`;
                    let path = `${folder}/${args.file.filename}`;

                    if (createFolder(folder)) {
                        let result = await filemanager.downloadFileToPath(args.file.downloadUrl, path, progress);
                        console.log('Finish download', result);
                        payload = { success: true };
                    } else {
                        throw new Error('Could not create folder');
                    }

                    /**
                     * Step 2: Open the file in Sketch
                     */

                    source.openSourceAtPath(path);

                    /**
                     * Step 3: Add the file to the Recent Files.
                     */

                    /**
                     * Step 4: Write the remote fields "modified" to the file.
                     */
                    console.log('Open file at', path);
                    console.log(sketch.getDocument());
                    sketch3.Settings.setDocumentSettingForKey(sketch.getDocument(), 'remote_modified', null);
                } catch (error) {
                    console.log(error);
                    payload = { success: false, error };
                }
                break;
            case 'getCurrentDocument':
                console.log('🔥 GET CURRENT DOCUMENT');
                /**
                 * The shape of the returned object.
                 * We’ll merge local, remote and meta information.
                 *
                 * Local:   This is the Sketch file.
                 * Remote:  This is the asset on Frontify.
                 * Refs:    This contains information stored inside the Sketch File that can
                 *          be used to find the corresponding asset on Frontify.
                 */
                let currentDocument = {
                    dirty: false,
                    state: 'untracked',
                    local: {
                        id: '',
                        filename: '',
                        path: '',
                        modified: '',
                    },
                    remote: {},
                    refs: {
                        remote_id: '',
                        remote_project_id: '',
                    },
                };

                let nativeSketchDocument = sketch.getDocument();

                let openSketchDocument;
                try {
                    openSketchDocument = sketch3.Document.fromNative(nativeSketchDocument);
                } catch (error) {
                    console.log(error);
                }

                let modified = sketch3.Settings.documentSettingForKey(sketch.getDocument(), 'remote_modified');
                console.log('MODIFIED', modified);

                /**
                 * Refs.
                 *
                 * This is information (eventually) stored inside the Sketch file.
                 * This information can be used to find the corresponding asset on Frontify.
                 */

                currentDocument.refs = {
                    remote_id: sketch3.Settings.documentSettingForKey(openSketchDocument, 'remote_id'),
                    remote_project_id: sketch3.Settings.documentSettingForKey(openSketchDocument, 'remote_project_id'),
                    remote_graphql_id: sketch3.Settings.documentSettingForKey(openSketchDocument, 'remote_graphql_id'),
                };

                console.log('refs', currentDocument.refs);

                /**
                 * State.
                 *
                 * This is the sync state.
                 *
                 */

                function getState(document) {
                    let { remote, local } = document;

                    let saved = local.id;
                    let tracked = remote.id;
                    let sameFile = local.sha == remote.sha;
                    let sameDate = local.modified == remote.modified;
                    let ahead = local.modified >= remote.modified ? 'local' : 'remote';
                    let conflict = (document.dirty && !sameFile) || (document.dirty && !sameFile && !sameDate);

                    console.log('conflict?', document, sameFile, conflict);

                    if (!saved) return 'unsaved';
                    if (!tracked) return 'untracked';

                    if (sameDate && !sameFile) {
                        return 'push';
                    }

                    if (sameFile) return 'same';

                    if (sameFile && sameDate) {
                        return 'same';
                    }

                    if (conflict) {
                        return 'conflict';
                    }

                    if (ahead == 'local' || !local.modified) return 'push';
                    if (ahead == 'remote') return 'pull';

                    return 'unknown';
                }

                if (currentDocument.refs.remote_id && currentDocument.refs.remote_project_id) {
                    // MARK: Hardcoded project id
                    let remoteAsset = await source.getRemoteAssetForProjectIDByAssetID(
                        currentDocument.refs.remote_project_id,
                        currentDocument.refs.remote_id
                    );
                    console.log(remoteAsset);
                    if (remoteAsset) {
                        currentDocument.remote = remoteAsset;
                    } else {
                        currentDocument.remote = null;
                        // Ooops! Could not find remote asset …
                        console.warn('No remote asset found', remoteAsset);
                    }
                }

                /**
                 * Local document.
                 *
                 * This is information about the document on the file system.
                 */

                if (!filemanager.isCurrentSaved()) {
                    currentDocument.state = 'unsaved';
                }

                if (filemanager.isCurrentSaved()) {
                    let filePath = '' + nativeSketchDocument.fileURL().path();
                    console.log(shaFile(filePath));
                    currentDocument.local = {
                        id: openSketchDocument.id,
                        filename: source.getCurrentFilename(),
                        path: filePath,
                        sha: '' + shaFile(filePath),
                        modified: modified,
                    };
                }

                /**
                 * Check if the document has a modified date from a previous fetch request.
                 * If not, then set it by using the remote modified date and store it the file.
                 * We can later use that information to compare local/remote changes.
                 *
                 * Good to know:
                 *
                 * The "modified" inside the file will also be mutated in other places, for example,
                 * after opening a file.
                 */

                if (!modified || currentDocument.remote.sha == currentDocument.local.sha) {
                    sketch3.Settings.setDocumentSettingForKey(
                        sketch.getDocument(),
                        'remote_modified',
                        currentDocument.remote.modified
                    );
                }

                console.log('💥 local & remote state gathered');

                console.log({ payload });

                // Dirty
                currentDocument.dirty = sketch3.Settings.documentSettingForKey(sketch.getDocument(), 'dirty');

                // Sync State
                currentDocument.state = getState(currentDocument);

                payload = { currentDocument };
                break;

            case 'getRecentFiles':
                try {
                    let files = recentFiles.get();
                    console.log('get recent files', files.length);
                    payload = { success: true, files };
                } catch (error) {
                    payload = { success: false, error };
                }
                break;

            case 'getProjectsForBrand':
                console.log('get projects');
                try {
                    let projects = await project.getProjectsForBrand(args.brand);
                    payload = { success: true, projects };
                } catch (error) {
                    payload = { success: false, error };
                }
                break;
            case 'getProjectFolders':
                try {
                    let { folder, folders } = await project.getProjectFolders(args.project, args.folder);
                    payload = { success: true, folder, folders };
                } catch (error) {
                    console.error(error);
                    payload = { success: false, error };
                }
                break;
            case 'getOpenDocuments':
                var documents = DOM.getDocuments();
                payload = { documents };
                break;
            case 'getAuth':
                let auth = user.getAuthentication();
                console.log('auth inside sketch -> send crendentials', auth);
                if (auth) {
                    payload = { auth };
                } else {
                    payload = { error: 'Could not read crendetials from Sketch' };
                }
                break;
            case 'getLocalAndRemoteSourceFiles':
                console.log('getLocalAndRemoteSourceFiles');
                try {
                    let sources = await source.getLocalAndRemoteSourceFiles();
                    payload = { success: true, sources };
                } catch (error) {
                    payload = { success: false, error };
                }
                break;

            case 'moveCurrent':
                try {
                    console.log('move current file to', args.folder);
                    await filemanager.moveCurrent(args.brand, args.project, args.folder);
                    payload = { success: true };
                } catch (error) {
                    payload = { success: false, error };
                }
                break;
            case 'openSource':
                try {
                    await source.openSourceAtPath(args.path);
                    payload = { success: true };
                } catch (error) {
                    payload = { success: false, error };
                }
                break;
            case 'requestUpdate':
                refresh();

                break;
            case 'pullSource':
                try {
                    /**
                     * 1. Checkout file
                     */

                    let result = await source.pullSource(args.source);
                    payload = { success: true, result };
                } catch (error) {
                    payload = { success: false, error };
                }

                break;
            case 'pushSource':
                try {
                    let result = await source.pushSource(args.source, args.target);
                    console.log(result);

                    console.log('should update date modified', result, result.modified);

                    /**
                     * Check if the document has a modified date from a previous fetch request.
                     * If not, then set it by using the remote modified date and store it the file.
                     * We can later use that information to compare local/remote changes.
                     *
                     * Good to know:
                     *
                     * The "modified" inside the file will also be mutated in other places, for example,
                     * after opening a file.
                     */

                    // compare SHA
                    let localAndRemoteAreEqual = true;
                    if (localAndRemoteAreEqual) {
                        sketch3.Settings.setDocumentSettingForKey(
                            sketch.getDocument(),
                            'remote_modified',
                            result.modified
                        );

                        // Mark document as clean, because there are no untracked changes
                        sketch3.Settings.setDocumentSettingForKey(sketch.getDocument(), 'dirty', false);
                    }
                    console.log('🌟 DONE PUSHING');
                    payload = { success: true };
                } catch (error) {
                    payload = { success: false, error };
                }
                break;
        }

        frontend.send('response', { responseUUID: requestUUID, ...payload });
    }

    // workarounds
    function getURL() {
        return '' + webview.getNativeWebview().URL();
    }

    return win;
}
