import BrowserWindow from 'sketch-module-web-view'
import artboard from '../model/artboard';
import project from '../model/project';
import filemanager from '../model/filemanager';
import source from '../model/source';
import target from '../model/target';
import sketch from '../model/sketch';
import color from '../model/color';
import typography from '../model/typography';
import asset from '../model/asset';
import user from '../model/user';
import createFolder from '../helpers/createFolder'

let threadDictionary = NSThread.mainThread().threadDictionary();

export default function(context, view) {
    let viewData = sketch.getViewData();
    let mainURL = require('../assets/views/main.html');
    let loginURL = require('../assets/views/login.html');
    let domain = '';

    // create window and webview
    let win = new BrowserWindow({
        identifier: 'frontifymain',
        titleBarStyle: 'default',
        backgroundColor: '#FFFFFF',
        width: viewData.width,
        height: viewData.height,
        title: 'Frontify',
        show: false,
        resizable: true,
        fullscreenable: false,
        maximizable: false,
        minimizable: false,
        alwaysOnTop: true
    });

    let webview = win.webContents;

    // Load initial url
    webview.loadURL(viewData.url);

    // Show window if ready
    win.once('ready-to-show', function() {
        win.show();
    }.bind(this));

    // Load tab if webview ready
    webview.on('did-finish-load', function() {
        sketch.resize(win);

        if (decodeURI(getURL()) == mainURL) {
            setTimeout(function() {
                target.showTarget();
                webview.executeJavaScript('switchTab("' + view + '")');
            }, 200);
        }
    }.bind(this));

    // Handle authentication redirect
    webview.on('did-get-redirect-request', function() {
        let url = getURL();
        if (url.startsWith('https://frontify.com/sketchplugin')) {
            let urlparts = url.split('?#access_token=');

            if(urlparts.length == 1) {
                // no access token part included -> back to login URL
                webview.loadURL(loginURL);
            }
            else {
                // login with access token
                let access_token = urlparts[1].split('&expires_in=31536000&token_type=bearer')[0];
                user.login({
                    access_token: access_token,
                    domain: domain
                });

                webview.loadURL(mainURL);
            }
        }
    }.bind(this));

    win.on('close', function() {
        threadDictionary.removeObjectForKey('frontifywindow');
    }.bind(this));

    // Handlers called from webview
    webview.on('logout', function() {
        user.logout().then(function() {
            webview.loadURL(loginURL);
        }.bind(this));
    });

    webview.on('memorizeDomain', function(url) {
        domain = url;
    });

    webview.on('showArtboards', function(skipRemote) {
        skipRemote = skipRemote || false;
        view = 'artboards';
        artboard.showArtboards(skipRemote);
    });

    webview.on('showSources', function() {
        view = 'sources';
        source.showSources();
    });

    webview.on('uploadArtboard', function(data) {
        artboard.uploadArtboards([data]);
    });

    webview.on('uploadArtboards', function(data) {
        artboard.uploadArtboards(data).then(function() {
            webview.executeJavaScript('artboardsUploaded()');
        }.bind(this));
    });

    webview.on('switchAssetSourceForType', function(type, assetSourceId) {
        target.getAssetSourcesForType(type).then(function(data) {
            if (data && data.sources) {
                let selected = data.sources.find(function(source) {
                    return source.id == assetSourceId
                }.bind(this));

                if (selected) {
                    target.switchAssetSourceForType(type, selected).then(function() {
                        webview.executeJavaScript('refresh()');
                    }.bind(this));
                }
            }
        }.bind(this));

    });

    webview.on('openUrl', function(url, absolute) {
        if (absolute) {
            NSWorkspace.sharedWorkspace().openURL(NSURL.URLWithString(url));
        }
        else {
            target.getDomain().then(function(data) {
                NSWorkspace.sharedWorkspace().openURL(NSURL.URLWithString(data + url));
            }.bind(this))
        }
    });

    webview.on('openFinder', function() {
        target.getTarget('sources').then(function(data) {
            if (createFolder(data.path)) {
                NSWorkspace.sharedWorkspace().openFile(data.path);
            }
        }.bind(this));
    });

    webview.on('changeProject', function() {
        return project.showProjectChooser();
    });


    webview.on('projectSelected', function(data) {
        target.updateTarget(data).then(function() {
            target.showTarget();
            webview.executeJavaScript('refresh()');
        }.bind(this));
    });

    webview.on('changeFolder', function(set) {
        project.showFolderChooser(set, view);
    });

    webview.on('folderSelected', function(set) {
        if (view == 'artboards') {
            target.updateTarget({set: set}).then(function() {
                artboard.showArtboards();
            }.bind(this))
        }
        else if (view == 'sources') {
            target.updateTarget({set_sources: set}).then(function() {
                source.showSources();
            }.bind(this))
        }
    });

    webview.on('addFolder', function(name, set) {
        project.addFolder(name, set).then(function() {
            project.showFolderChooser(set, view);
        }.bind(this));
    });

    webview.on('openSource', function(data) {
        source.openSource(data);
    });

    webview.on('downloadSource', function(source) {
        source.type = 'source';
        filemanager.downloadFile(source).then(function(path) {
            webview.executeJavaScript('sourceDownloaded(' + JSON.stringify(source) + ')');
        }.bind(this)).catch(function(e) {
            webview.executeJavaScript('sourceDownloadFailed(' + JSON.stringify(source) + ')');
        }.bind(this));
    });

    webview.on('pushSource', function(data) {
        source.pushSource(data);
    });

    webview.on('pullSource', function(source) {
        source.type = 'source';
        filemanager.downloadFile(source).then(function(path) {
            webview.executeJavaScript('sourceDownloaded(' + JSON.stringify(source) + ')');
            if (source.current == true && NSDocumentController.sharedDocumentController().currentDocument()) {
                NSDocumentController.sharedDocumentController().currentDocument().close();
                filemanager.openFile(path);
            }
        }.bind(this)).catch(function(e) {
            webview.executeJavaScript('sourceDownloadFailed(' + JSON.stringify(source) + ')');
        }.bind(this));
    });

    webview.on('addSource', function(data) {
        source.addSource(data);
    });

    webview.on('addCurrentFile', function() {
        source.addCurrentFile();
    });

    webview.on('moveCurrentFile', function() {
        if (filemanager.moveCurrent()) {
            webview.executeJavaScript('refresh()');
        }
    });

    webview.on('resolveConflict', function(id) {
        webview.executeJavaScript('showSourcesConflict(' + id + ')');
    });

    webview.on('showColors', function() {
        view = 'colors';
        color.showColors();
    });

    webview.on('applyColor', function(data) {
        color.applyColor(data);
    });

    webview.on('addDocumentColors', function(colors) {
        color.addDocumentColors(colors);
    });

    webview.on('replaceDocumentColors', function(colors) {
        color.replaceDocumentColors(colors);
    });

    webview.on('addGlobalColors', function(colors) {
        color.addGlobalColors(colors);
    });

    webview.on('replaceGlobalColors', function(colors) {
        color.replaceGlobalColors(colors);
    });

    webview.on('showTypography', function() {
        view = 'typography';
        typography.showTypography();
    });

    webview.on('addFontStyles', function(styles) {
        typography.addFontStyles(styles);
    });

    webview.on('applyFontStyle', function(style) {
        typography.applyFontStyle(style);
    });

    webview.on('downloadFonts', function() {
        typography.downloadFonts();
    });

    webview.on('online', function() {
        target.showTarget();
        webview.executeJavaScript('switchTab("' + view + '")');
    });

    // Images, Logos and Icons
    webview.on('showLibrary', function(type) {
        view = type;
        target.getAssetSourcesForType(type).then(function(assetSources) {
            if(assetSources && assetSources.selected) {
                webview.executeJavaScript('showAssetSources(' + JSON.stringify(assetSources) + ')');
                webview.executeJavaScript('showLibrarySearch("' + type + '")');
                asset.search(type, '');
            }
        }.bind(this));
    });

    webview.on('searchLibraryAssets', function(type, query) {
        asset.search(type, query);
    });

    webview.on('applyLibraryAsset', function(data) {
        asset.applyImage(data);
    });

    // workarounds
    function getURL() {
        return '' + webview.getNativeWebview().URL()
    }

    return win;
}
