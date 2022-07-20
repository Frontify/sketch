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
import executeSafely from '../helpers/executeSafely';

// Message helper
import { frontend } from '../helpers/ipc';

/**
 * Actions that can be called from React via the useSketch() hook.
 * For information on the parameters, check the implementation of the
 * function. The parameters are defined using the spread operator.
 */
import { getSelectedArtboards, removeDestination, removeDestinations } from './actions/getSelectedArtboards';
import { uploadArtboards } from './actions/uploadArtboards';

import recentFiles from '../model/recent';

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

let state = {};

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

export default function (context, view) {
    let baseURL = isDev ? 'http://localhost:3000' : pathInsidePluginBundle('index.html');
    let mainURL = `${baseURL}/#/source/artboards`;

    // create window and webview
    let win = new BrowserWindow({
        alwaysOnTop: true,
        fullscreenable: false,
        hidesOnDeactivate: true,
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
    webview.on('did-finish-load', () => {
        console.log('did-finish-load');
    });

    webview.on('did-fail-load', (error) => {
        console.log('did-fail-load', { isDev, baseURL, mainURL }, error);
    });

    webview.on('nativeLog', function (s) {
        sketch.UI.message(s);

        return 'result';
    });

    win.on(
        'close',
        function () {
            console.log('close');
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

    /**
     * Used to hard-refresh using the "refresh" icon in the toolbar of the plugin
     */
    webview.on('reload', function () {
        webview.reload();
    });

    /**
     *
     * @returns Requests that can be received from the Frontend
     */
    webview.off('request', handleRequestFromFrontend);
    webview.on('request', handleRequestFromFrontend);

    /**
     * Todo: Refactor each case into one action file.
     * Then, create a map for all functions.
     * Then, call the function directly and pass all args to it.
     */

    let actions = {
        getSelectedArtboards,
        uploadArtboards,
    };

    async function handleRequestFromFrontend({ type = '', requestUUID = null, args = {} }) {
        let payload = {};
        // console.log('request!', new Date().getTime(), type, args, state);
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

                    if (response.id) {
                        // Set Asset ID, saved inside the Sketch File
                        sketch3.Settings.setDocumentSettingForKey(sketch.getDocument(), 'remote_id', response.id);

                        // Set Project ID, saved inside the Sketch File
                        sketch3.Settings.setDocumentSettingForKey(
                            sketch.getDocument(),
                            'remote_project_id',
                            args.target.project.id
                        );

                        // Set Brand ID, saved inside the Sketch File
                        sketch3.Settings.setDocumentSettingForKey(
                            sketch.getDocument(),
                            'remote_brand_id',
                            args.target.brand.id
                        );
                    }
                    payload = { success: true, response };
                } catch (error) {
                    payload = { success: false, error };
                }
                break;
            case 'applyColor':
                executeSafely(context, () => {
                    color.applyColor(args);
                });
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
            case 'cancelArtboardUpload':
                artboard.cancelUpload();
                break;
            case 'checkout':
                try {
                    /**
                     * Step 1: Download the file to the Sync Folder.
                     */

                    console.log('🎈 Checking out a file…', args);

                    var progress = NSProgress.progressWithTotalUnitCount(10);
                    progress.setCompletedUnitCount(0);

                    // Base + File Path

                    let path = args.path;

                    if (!args.useFullPath) {
                        let base = target.getPathToSyncFolder();
                        let folder = `${base}/${args.path}`;
                        path = `${folder}/${args.file.filename}`;

                        if (createFolder(folder)) {
                        } else {
                            throw new Error('Could not create folder');
                        }
                    }

                    let result = await filemanager.downloadFileToPath(args.file.downloadUrl, path, progress);

                    payload = { success: true };

                    /**
                     * Step 2: Open the file in Sketch
                     */
                    // Close file first?
                    // Todo: Only close the document if it’s the same one that has been checked out (pull / checkout override)
                    if (sketch.getDocument()) NSDocumentController.sharedDocumentController().currentDocument().close();

                    source.openSourceAtPath(path);

                    /**
                     * Step 3: Add the file to the Recent Files.
                     */

                    /**
                     * Step 4: Write the remote fields "modified" to the file.
                     */

                    sketch3.Settings.setDocumentSettingForKey(sketch.getDocument(), 'remote_modified', null);
                } catch (error) {
                    console.log(error);
                    payload = { success: false, error };
                }
                break;
            case 'getCurrentDocument':
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
                        relativePath: '',
                        modified: '',
                    },
                    remote: {},
                    refs: {
                        remote_id: '',
                        remote_project_id: '',
                    },
                };

                let nativeSketchDocument = sketch.getDocument();

                if (!nativeSketchDocument) {
                    // Flag the payload, so that React knows that there’s no open file
                    currentDocument.state = 'unsaved';
                    currentDocument.local = null;
                    payload = { currentDocument };
                    break;
                }

                let openSketchDocument;
                try {
                    openSketchDocument = sketch3.Document.fromNative(nativeSketchDocument);
                } catch (error) {
                    console.log(error);
                }

                let modified = sketch3.Settings.documentSettingForKey(sketch.getDocument(), 'remote_modified');

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

                /**
                 * State.
                 *
                 * This is the sync state.
                 *
                 */

                function getState(document) {
                    let { remote, local } = document;

                    if (!document.remote) return 'untracked';

                    let saved = local.id;
                    let tracked = remote?.id;
                    let sameFile = local.sha == remote?.sha;
                    let sameDate = local.modified == remote?.modified;
                    let ahead = local.modified >= remote?.modified ? 'local' : 'remote';
                    let conflict = (document.dirty && !sameFile) || (document.dirty && !sameFile && !sameDate);

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
                    console.log('fetching…', currentDocument);
                    // MARK: Hardcoded project id
                    let remoteAsset = await source.getRemoteAssetForProjectIDByAssetID(
                        currentDocument.refs.remote_project_id,
                        currentDocument.refs.remote_id
                    );

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
                    let base = target.getPathToSyncFolder();
                    let relativePath = filePath.replace(base + '/', '');

                    currentDocument.local = {
                        id: openSketchDocument.id,
                        filename: source.getCurrentFilename(),
                        path: filePath,
                        relativePath,
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

                if (!modified || currentDocument.remote?.sha == currentDocument.local?.sha) {
                    sketch3.Settings.setDocumentSettingForKey(
                        sketch.getDocument(),
                        'remote_modified',
                        currentDocument.remote.modified
                    );
                }

                // Dirty
                currentDocument.dirty = sketch3.Settings.documentSettingForKey(sketch.getDocument(), 'dirty');

                // Sync State
                currentDocument.state = getState(currentDocument);

                console.log(JSON.stringify(currentDocument, null, 2));
                payload = { currentDocument };
                break;

            case 'getRecentFiles':
                try {
                    let files = recentFiles.get();

                    payload = { success: true, files };
                } catch (error) {
                    payload = { success: false, error };
                }
                break;

            case 'createFolder':
                try {
                    console.log(args);
                    let response = await project.addFolder2({ ...args });
                    payload = { success: true, response };
                } catch (error) {
                    payload = { success: false, error };
                }
                break;

            case 'getProjectsForBrand':
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
            case 'getSelectedArtboards':
                payload = actions['getSelectedArtboards'](args);
                break;

            case 'getOpenDocuments':
                var documents = DOM.getDocuments();
                payload = { documents };
                break;
            case 'getOpenDocumentsMeta':
                let openDocuments = DOM.getDocuments();
                let base = target.getPathToSyncFolder();

                let openDocumentsMeta = openDocuments.map((document) => {
                    let relativePath = document.path.replace(base + '/', '');
                    return {
                        id: document.id,
                        name: relativePath.split('/').pop().replace('.sketch', '').replaceAll('%20', ' '),
                        path: document.path,
                        relativePath: relativePath,
                        normalizedPath: document.path.replaceAll('%20', ' '),
                        normalizedRelativePath: relativePath.replaceAll('%20', ' '),
                        remote_modified: sketch3.Settings.documentSettingForKey(document, 'remote_modified'),
                    };
                });
                payload = { documents: openDocumentsMeta };
                break;
            case 'getAuth':
                let auth = user.getAuthentication();

                if (auth) {
                    payload = { auth };
                } else {
                    payload = { error: 'Could not read crendetials from Sketch' };
                }
                break;
            case 'getLocalAndRemoteSourceFiles':
                try {
                    let sources = await source.getLocalAndRemoteSourceFiles();
                    payload = { success: true, sources };
                } catch (error) {
                    payload = { success: false, error };
                }
                break;
            case 'openUrl':
                let url = args.url;
                let absolute = args.absolute || true;

                if (absolute) {
                    NSWorkspace.sharedWorkspace().openURL(NSURL.URLWithString(url));
                } else {
                    target.getDomain().then(
                        function (data) {
                            NSWorkspace.sharedWorkspace().openURL(NSURL.URLWithString(data + url));
                        }.bind(this)
                    );
                }
                break;
            case 'moveCurrent':
                try {
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

                    payload = { success: true };
                } catch (error) {
                    payload = { success: false, error };
                }
                break;
            case 'removeAllDestinations':
                removeDestinations({ id: args.id });

                let artboardsAfterRemovingAllDestinations = getSelectedArtboards(args.brandID);

                frontend.send('artboards-changed', artboardsAfterRemovingAllDestinations);

                payload = { success: true };

                break;
            case 'removeDestination':
                removeDestination({ id: args.id }, args.destination);

                let artboardsAfterRemovingDestination = getSelectedArtboards(args.brandID);

                frontend.send('artboards-changed', artboardsAfterRemovingDestination);

                payload = { success: true };

                break;
            case 'reveal':
                if (createFolder(args.path)) {
                    try {
                        NSWorkspace.sharedWorkspace().openFile(args.path);
                    } catch (error) {
                        console.log(error);
                    }
                }
                break;
            case 'uploadArtboards':
                try {
                    actions['uploadArtboards'](args);
                } catch (error) {
                    console.error(error);
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
