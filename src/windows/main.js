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

import { sendToWebview } from 'sketch-module-web-view/remote';

let DOM = require('sketch/dom');
let sketch3 = require('sketch');

console.log('main.js');
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

    webview.on('request', async ({ type = '', requestUUID = null, args = {} }) => {
        let payload = {};
        console.log('request', type, args);
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
            case 'getCurrentDocument':
                console.log('🔥');
                let currentDocument = await source.getCurrentAsset();
                console.log('✅', currentDocument);
                if (!currentDocument) {
                    let doc;
                    try {
                        doc = sketch.getDocument();
                        console.log(doc);
                        currentDocument = sketch3.Document.fromNative(doc);
                    } catch (error) {
                        console.log(error);
                    }
                    currentDocument = {
                        remote_id: sketch3.Settings.documentSettingForKey(sketch.getDocument(), 'remote_id'),
                        remote_project_id: sketch3.Settings.documentSettingForKey(
                            sketch.getDocument(),
                            'remote_project_id'
                        ),
                        id: currentDocument.id,
                        filename: source.getCurrentFilename(),
                        path: '' + doc.fileURL().path(),
                        state: 'untracked',
                    };
                    if (currentDocument.remote_id && currentDocument.remote_project_id) {
                        // MARK: Hardcoded project id
                        let remoteAsset = await source.getRemoteAssetForProjectIDByAssetID(
                            currentDocument.remote_project_id,
                            currentDocument.remote_id
                        );
                        if (remoteAsset) {
                            currentDocument.state = 'same';
                            currentDocument.asset = remoteAsset;
                        } else {
                            currentDocument.asset = null;
                        }
                    }
                }

                payload = { currentDocument };
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
                    await source.openSource(args.source);
                    payload = { success: true };
                } catch (error) {
                    payload = { success: false, error };
                }
                break;
            case 'pushSource':
                try {
                    await source.pushSource(args.source, args.target);
                    payload = { success: true };
                } catch (error) {
                    payload = { success: false, error };
                }
                break;
        }

        frontend.send('response', { responseUUID: requestUUID, ...payload });
    });

    // workarounds
    function getURL() {
        return '' + webview.getNativeWebview().URL();
    }

    return win;
}
