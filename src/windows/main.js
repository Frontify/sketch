import WebUI from 'sketch-module-web-view'
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

export default function (context, view) {
    var viewData = sketch.getViewData();
    var mainURL = require('../assets/views/main.html');
    var loginURL = require('../assets/views/login.html');
    var domain = '';

    var mainUI = new WebUI(context, viewData.url, {
        identifier: 'frontifymain',
        x: 0,
        y: 0,
        width: viewData.width,
        height: viewData.height,
        onlyShowCloseButton: true,
        title: 'Frontify',
        resizable: true,
        frameLoadDelegate: {
            'webView:didFinishLoadForFrame:': function (webView, webFrame) {
                sketch.resize(mainUI);

                if (decodeURI(webView.mainFrameURL()) == mainURL) {
                    target.showTarget(mainUI);
                    mainUI.eval('switchTab("' + view + '")');
                }
            },
            'webView:didReceiveServerRedirectForProvisionalLoadForFrame:': function (webView, navigation) {
                if (webView.mainFrameURL().startsWith('https://frontify.com/sketchplugin')) {
                    var access_token = webView.mainFrameURL().split('?#access_token=')[1].split('&expires_in=31536000&token_type=bearer')[0];

                    user.login({
                        access_token: access_token,
                        domain: domain
                    });

                    webView.mainFrameURL = mainURL;
                }
            }
        },
        onPanelClose: function () {
            threadDictionary.removeObjectForKey('frontifymainui');
        },
        handlers: {
            logout: function () {
                user.logout().then(function () {
                    mainUI.webView.mainFrameURL = loginURL;
                }.bind(this));
            },
            memorizeDomain: function (url) {
                domain = url;
            },
            showArtboards: function () {
                view = 'artboards';
                artboard.showArtboards(mainUI);
            },
            showSources: function () {
                view = 'sources';
                source.showSources(mainUI);
            },
            uploadArtboard: function (data) {
                artboard.uploadArtboards(mainUI, [data]);
            },
            uploadArtboards: function (data) {
                artboard.uploadArtboards(mainUI, data).then(function () {
                    mainUI.eval('artboardsUploaded()');
                }.bind(this));
            },
            openUrl: function (url, absolute) {
                if (absolute) {
                    NSWorkspace.sharedWorkspace().openURL(NSURL.URLWithString(url));
                }
                else {
                    target.getDomain().then(function (data) {
                        NSWorkspace.sharedWorkspace().openURL(NSURL.URLWithString(data + url));
                    }.bind(this))
                }
            },
            openFinder: function () {
                target.getTarget('sources').then(function (data) {
                    if (createFolder(data.path)) {
                        NSWorkspace.sharedWorkspace().openFile(data.path);
                    }
                }.bind(this));
            },
            changeProject: function () {
                return project.showProjectChooser(mainUI);
            },
            projectSelected: function (data) {
                target.updateTarget(data).then(function () {
                    target.showTarget(mainUI);
                    mainUI.eval('refresh()');
                }.bind(this));
            },
            changeFolder: function (set) {
                project.showFolderChooser(mainUI, set, view);
            },

            folderSelected: function (set) {
                if (view == 'artboards') {
                    target.updateTarget({set: set}).then(function () {
                        artboard.showArtboards(mainUI);
                    }.bind(this))
                }
                else if (view == 'sources') {
                    target.updateTarget({set_sources: set}).then(function () {
                        source.showSources(mainUI);
                    }.bind(this))
                }
            },

            addFolder: function (name, set) {
                project.addFolder(name, set).then(function () {
                    project.showFolderChooser(mainUI, set, view);
                }.bind(this));
            },

            openSource: function (data) {
                source.openSource(data);
            },

            downloadSource: function (source) {
                filemanager.downloadFile(source).then(function (path) {
                    mainUI.eval('sourceDownloaded(' + JSON.stringify(source) + ')');
                }.bind(this)).catch(function (err) {
                    mainUI.eval('sourceDownloadFailed(' + JSON.stringify(source) + ')');
                }.bind(this));
            },

            pushSource: function (data) {
                source.pushSource(mainUI, data);
            },

            pullSource: function (source) {
                filemanager.downloadFile(source).then(function (path) {
                    mainUI.eval('sourceDownloaded(' + JSON.stringify(source) + ')');
                    if (source.current == true && NSDocumentController.sharedDocumentController().currentDocument()) {
                        NSDocumentController.sharedDocumentController().currentDocument().close();
                        filemanager.openFile(path);
                    }
                }.bind(this)).catch(function (err) {
                    mainUI.eval('sourceDownloadFailed(' + JSON.stringify(source) + ')');
                }.bind(this));
            },

            addSource: function (data) {
                source.addSource(mainUI, data);
            },

            addCurrentFile: function () {
                source.addCurrentFile(mainUI);
            },

            moveCurrentFile: function () {
                if (filemanager.moveCurrent()) {
                    mainUI.eval('refresh()');
                }
            },

            resolveConflict: function (id) {
                mainUI.eval('showSourcesConflict(' + id + ')');
            },

            showColors: function () {
                view = 'colors';
                color.showColors(mainUI);
            },

            applyColor: function (data) {
                color.applyColor(data);
            },

            addDocumentColors: function (colors) {
                color.addDocumentColors(colors);
            },

            replaceDocumentColors: function (colors) {
                color.replaceDocumentColors(colors);
            },

            addGlobalColors: function (colors) {
                color.addGlobalColors(colors);
            },

            replaceGlobalColors: function (colors) {
                color.replaceGlobalColors(colors);
            },

            showTypography: function () {
                view = 'typography';
                typography.showTypography(mainUI);
            },

            addFontStyles: function (styles) {
                typography.addFontStyles(styles);
            },

            applyFontStyle: function (style) {
                typography.applyFontStyle(style);
            },

            downloadFonts: function () {
                typography.downloadFonts();
            },

            online: function () {
                target.showTarget(mainUI);
                mainUI.eval('switchTab("' + view + '")');
            }
        }
    });

    mainUI.panel.setTitlebarAppearsTransparent(true);

    mainUI.refresh = function () {
        if (view == 'sources' || view == 'artboards') {
            mainUI.eval('refresh()');
        }
    };

    mainUI.selectionChanged = function (context) {
        color.setDocument(context.document);
        color.setSelection(context.document.selectedLayers().layers());
        typography.setDocument(context.document);
        typography.setSelection(context.document.selectedLayers().layers());
    };

    return mainUI;
}


