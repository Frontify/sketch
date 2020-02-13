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
import { runCommand } from '../commands/frontify'
import {generateChallengeCodeFromVerifier, generateUrl, generateVerifier, fetchSessionId} from "../helpers/login";

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

    webview.on('did-fail-load', function(err) {
        console.log('did-fail-load', err);
    }.bind(this));

    // Handle authentication redirect
    webview.on('did-get-redirect-request', function() {
        let url = getURL();
        if (url.startsWith('https://frontify.com/sketchplugin')) {
            let urlparts = url.split('?#access_token=');

            if(urlparts.length !== 1) {
                // login with access token
                let access_token = urlparts[1].split('&expires_in=31536000&token_type=bearer')[0];

                user.login({
                    access_token: access_token,
                    domain: domain
                }).then(function() {
                    win.close();
                    runCommand(context);
                }.bind(this));
            }
        }
    }.bind(this));

    win.on('close', function() {
        threadDictionary.removeObjectForKey('frontifywindow');
    }.bind(this));

    // Handlers called from webview
    webview.on('logout', function() {
        user.logout().then(function() {
            win.close();
            runCommand(context);
        }.bind(this));
    });

    webview.on('memorizeDomain', function(url) {
        domain = url;
    });

    webview.on('beginLoginFlow', function({domain, verifier, challenge}) {
        console.log(domain, verifier, challenge);
        fetchSessionId(domain)
            .then(sessionId => {
                console.log('Generated session id: ', sessionId)
                const verifier = generateVerifier()
                // const challengeCode = generateChallengeCodeFromVerifier(verifier)

                const url = generateUrl('/api/oauth/authorize', {
                    response_type : 'code',
                    client_id: 'sketch',
                    scope: 'api:v1',
                    // code_challenge_method: 'S256',
                    // code_challenge: challengeCode,
                    redirect_uri: 'https://frontify.com/sketchplugin',
                    session_id: sessionId
                });

                console.log('URL', url);
                console.log('Domain', domain);

                // Open the URL in the browser
                NSWorkspace.sharedWorkspace().openURL(NSURL.URLWithString(domain + url))
            });
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

    webview.on('downloadSource', function(data) {
        source.downloadSource(data);
    });

    webview.on('pushSource', function(data) {
        source.pushSource(data);
    });

    webview.on('pullSource', function(data) {
        source.pullSource(data);
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
