import BrowserWindow from 'sketch-module-web-view'
import artboard from '../model/artboard';
import project from '../model/project';
import filemanager from '../model/filemanager';
import source from '../model/source';
import target from '../model/target';
import sketch from '../model/sketch';
import color from '../model/color';
import typography from '../model/typography';
import user from '../model/user';
import createFolder from '../helpers/createFolder'

var threadDictionary = NSThread.mainThread().threadDictionary();

export default function(context, view) {
    var viewData = sketch.getViewData();
    var mainURL = require('../assets/views/main.html');
    var loginURL = require('../assets/views/login.html');
    var domain = '';

    // create window and webview
    var win = new BrowserWindow({
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

    var webview = win.webContents;

    // Load initial url
    win.loadURL(viewData.url);

    // Show window if ready
    win.once('ready-to-show', function() {
        win.show();
    }.bind(this));

    // Load tab if webview ready
    webview.on('did-frame-finish-load', function() {
        sketch.resize(win);

        if (decodeURI(getURL()) == mainURL) {
            target.showTarget();
            webview.executeJavaScript('switchTab("' + view + '")');
        }
    }.bind(this));

    // Handle authentication redirect
    webview.on('did-get-redirect-request', function() {
        var url = getURL();
        if (url.startsWith('https://frontify.com/sketchplugin')) {
            var access_token = url.split('?#access_token=')[1].split('&expires_in=31536000&token_type=bearer')[0];

            user.login({
                access_token: access_token,
                domain: domain
            });

            win.loadURL(mainURL);
        }
    }.bind(this));

    win.on('close', function() {
        threadDictionary.removeObjectForKey('frontifywindow');
    }.bind(this));

    // Handlers called from webview
    webview.on('logout', function() {
        user.logout().then(function() {
            win.loadURL(loginURL);
        }.bind(this));
    });

    webview.on('memorizeDomain', function(url) {
        domain = url;
    });

    webview.on('showArtboards', function() {
        view = 'artboards';
        artboard.showArtboards();
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
        }.bind(this)).catch(function(err) {
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
        }.bind(this)).catch(function(err) {
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

    // workarounds
    function getURL() {
        return '' + webview.getNativeWebview().URL()
    }

    return win;
}
