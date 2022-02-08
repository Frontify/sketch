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
import { runCommand } from '../commands/frontify';
import { sendToWebview } from 'sketch-module-web-view/remote';

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
        sendToWebview(IDENTIFIER, `send(${JSON.stringify({ type, payload })})`);
    },
};

export default function (context, view) {
    let viewData = sketch.getViewData();

    // viewData.url -> depending on the authorization state, returns "/" or "/signin"
    let baseURL = isDev ? 'http://localhost:3000' : pathInsidePluginBundle('index.html');
    let mainURL = `${baseURL}${viewData.url}`;

    let domain = '';

    // create window and webview
    let win = new BrowserWindow({
        acceptsFirstMouse: true,
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
    webview.loadURL(mainURL);

    // Show window if ready
    win.once('ready-to-show', () => {
        console.log('👋 Frontify Plugin is now running. NODE_ENV: ', process.env.NODE_ENV);
        win.show();
        // Provide the authentication details to React
        let auth = user.getAuthentication();
        frontend.send('user.authentication', auth);
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
                    win.close();
                    // I guess this re-starts the plugin, which will then have the access token available?
                    runCommand(context);
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
        user.logout().then(
            function () {
                win.close();
                runCommand(context);
            }.bind(this)
        );
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

    webview.on('applyColor', function (data) {
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

    webview.on('applyLibraryAsset', function (data) {
        asset.applyImage(data);
    });

    // workarounds
    function getURL() {
        return '' + webview.getNativeWebview().URL();
    }

    return win;
}
