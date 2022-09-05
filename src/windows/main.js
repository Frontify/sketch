// Sketch API
import sketch from 'sketch';

// Browser Window
import BrowserWindow from 'sketch-module-web-view';

// Models
import Artboard from '../model/artboard';
import Asset from '../model/asset';
import Color from '../model/color';
import FileManager from '../model/FileManager';
import OAuth from '../model/oauth';
import Project from '../model/project';
import Source from '../model/source';
import Target from '../model/target';
import Typography from '../model/typography';
import User from '../model/user';

// Helpers
import { getDocument } from '../helpers/sketch';
import createFolder from '../helpers/createFolder';
import shaFile from '../helpers/shaFile';

// IPC
import { frontend } from '../helpers/ipc';
import executeSafely from '../helpers/executeSafely';

/**
 * Actions that can be called from React via the useSketch() hook.
 * For information on the parameters, check the implementation of the
 * function. The parameters are defined using the spread operator.
 */
import { addSource, getSelectedArtboards, removeDestination, removeDestinations, uploadArtboards } from './actions/';
import { refresh } from '../commands/frontify';

// ------------------------------------------------------------------------

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

export default function (context) {
    // We’ll first load the base url because that will work in a file:/// context.
    // The frontend will redirect to a different route once the webview is loaded.
    let baseURL = isDev ? 'http://localhost:3000' : pathInsidePluginBundle('index.html');

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

    // ------------------------------------------------------------------------

    webview.loadURL(baseURL);

    // Show window if ready
    win.once('ready-to-show', () => {
        console.log('👋 Frontify Plugin is now running. NODE_ENV: ', process.env.NODE_ENV);
        win.show();
    });

    // ------------------------------------------------------------------------

    win.on('focus', () => {
        refresh();
    });

    // ------------------------------------------------------------------------

    webview.on('did-finish-load', () => {
        // Notify the frontend that the webview has loaded which will trigger a redirect.
        frontend.send('did-finish-load');
    });

    webview.on('did-fail-load', (error) => {
        console.log('did-fail-load', { isDev, baseURL, mainURL }, error);
    });

    win.on(
        'close',
        function () {
            threadDictionary.removeObjectForKey('frontifywindow');
        }.bind(this)
    );

    // ------------------------------------------------------------------------

    /**
     * Used to hard-refresh using the "refresh" icon in the toolbar of the plugin
     */
    webview.on('reload', function () {
        webview.reload();
    });

    // ------------------------------------------------------------------------

    /**
     *
     * @returns Requests that can be received from the Frontend
     */
    webview.off('request', handleRequestFromFrontend);
    webview.on('request', handleRequestFromFrontend);

    async function handleRequestFromFrontend({ type = '', requestUUID = null, args = {} }) {
        await frontend.fire(type, { requestUUID, ...args });
    }

    /**
     * Todo: Refactor each case into one action file.
     * Then, create a map for all functions.
     * Then, call the function directly and pass all args to it.
     */

    let actions = {
        addSource,
        getSelectedArtboards,
        uploadArtboards,
    };

    // ------------------------------------------------------------------------

    frontend.on('addSource', async (args) => {
        let response = await actions['addSource'](args);
        return response;
    });

    // ------------------------------------------------------------------------

    frontend.on('applyColor', (color) => {
        executeSafely(context, () => {
            Color.applyColor(color);
        });
    });

    // ------------------------------------------------------------------------

    frontend.on('addGlobalColors', ({ colors }) => {
        try {
            Color.addGlobalColors(colors);
        } catch (error) {
            throw new Error('Could not add global colors.');
        }
    });

    // ------------------------------------------------------------------------

    frontend.on('replaceGlobalColors', ({ colors }) => {
        try {
            Color.replaceGlobalColors(colors);
        } catch (error) {
            throw new Error('Could not replace global colors.');
        }
    });

    // ------------------------------------------------------------------------

    frontend.on('addDocumentColors', ({ colors }) => {
        try {
            Color.addDocumentColors(colors);
        } catch (error) {
            throw new Error('Could not add document colors.');
        }
    });

    // ------------------------------------------------------------------------

    frontend.on('clearMenu', () => {
        console.log('clearMenu');
        try {
            FileManager.deleteAssetDatabase();
        } catch (error) {
            throw new Error('Could not delete menu database.');
        }
    });

    // ------------------------------------------------------------------------

    frontend.on('replaceDocumentColors', ({ colors }) => {
        try {
            Color.replaceDocumentColors(colors);
        } catch (error) {
            throw new Error('Could not replace document colors.');
        }
    });

    // ------------------------------------------------------------------------

    frontend.on('addFontStyles', ({ styles }) => {
        try {
            Typography.addFontStyles(styles);
        } catch (error) {
            throw new Error('Could not add text styles.');
        }
    });

    // ------------------------------------------------------------------------

    frontend.on('downloadFonts', ({ projectID }) => {
        try {
            Typography.downloadFonts(projectID);
        } catch (error) {
            throw new Error('Could not download fonts.');
        }
    });

    // ------------------------------------------------------------------------

    frontend.on('importFontStyles', ({ styles, prefix }) => {
        try {
            Typography.importFontStyles(styles, prefix);
        } catch (error) {
            throw new Error('Could not add text styles.');
        }
    });

    // ------------------------------------------------------------------------

    frontend.on('getCurrentDocument', () => {
        try {
            let database = FileManager.getAssetDatabaseFile();
            let selectedDocument = sketch.Document.getSelectedDocument();
            let entry = database[selectedDocument.id];

            if (!entry) {
                if (!FileManager.isCurrentSaved()) {
                    entry = {
                        state: 'unsaved',
                    };
                }

                if (FileManager.isCurrentSaved()) {
                    let nativeSketchDocument = getDocument();
                    let filePath = '' + nativeSketchDocument.fileURL().path();
                    let base = Target.getPathToSyncFolder();
                    let relativePath = filePath.replace(base + '/', '');

                    entry = {
                        state: 'untracked',
                        uuid: selectedDocument.id,
                        filename: Source.getCurrentFilename(),
                        path: filePath,
                        relativePath: relativePath,
                        sha: '' + shaFile(filePath),
                    };
                }
            }

            // Get the latest remote info:
            return { currentDocument: entry };
        } catch (error) {
            console.error(error);
        }
    });

    // ------------------------------------------------------------------------

    frontend.on('applyFontStyleWithColor', async ({ textStyle, color, prefix }) => {
        try {
            await Typography.applyFontStyle(textStyle, color, prefix);
            return { sucess: 'true' };
        } catch (error) {
            return { sucess: 'false' };
        }
    });

    // ------------------------------------------------------------------------

    frontend.on('applyLibraryAsset', async ({ asset, width }) => {
        try {
            await Asset.applyImage(asset, width || null);
        } catch (error) {
            throw new Error('Could not apply library asset.');
        }
    });

    // ------------------------------------------------------------------------

    frontend.on('beginOAuthFlow', async (args) => {
        let domain = args.domain;
        let payload = {};
        OAuth.authorize(domain).then((authData) => {
            if (authData.hasError) {
                console.log(authData.error);
                payload = { success: false, error: authData.error };
                return;
            }

            if (!authData.hasError) {
                User.login({
                    access_token: authData.accessToken,
                    domain: domain,
                })
                    .then(
                        function () {
                            // I guess this re-starts the plugin, which will then have the access token available?
                            frontend.send('user.authentication', {
                                access_token: authData.accessToken,
                                domain: domain,
                            });
                            // runCommand(context);

                            payload = { success: true };
                        }.bind(this)
                    )
                    .catch((error) => {
                        console.error(error);
                        payload = { success: false, error };
                    });
            }
            return payload;
        });
    });

    // ------------------------------------------------------------------------

    frontend.on('zoomToArtboard', ({ id }) => {
        try {
            let currentDocument = sketch.getSelectedDocument();
            let layer = sketch.find(`[id="${id}"]`)[0];
            let page = layer.parent;
            let currentPage = currentDocument.selectedPage;
            currentPage.selected = false;
            page.selected = true;
            currentDocument.centerOnLayer(layer);
        } catch (error) {
            throw new Error('Could not cancel polling.');
        }
    });

    // ------------------------------------------------------------------------

    frontend.on('cancelOauthFlow', () => {
        try {
            OAuth.cancelAuthorizationPolling();
        } catch (error) {
            throw new Error('Could not cancel polling.');
        }
    });

    // ------------------------------------------------------------------------

    frontend.on('cancelArtboardUpload', () => {
        Artboard.cancelUpload();
    });

    // ------------------------------------------------------------------------

    frontend.on('checkout', async ({ source, path }) => {
        try {
            return await Source.checkout(source, path);
        } catch (error) {
            throw new Error('Could not checkout source.');
        }
    });

    // ------------------------------------------------------------------------

    frontend.on('refreshCurrentAsset', async () => {
        try {
            let database = FileManager.getAssetDatabaseFile();
            let selectedDocument = sketch.Document.getSelectedDocument();
            let entry = database[selectedDocument.id];

            // Fetch GraphQL
            if (entry) {
                entry = await FileManager.refreshAsset(entry.uuid);

                return { currentDocument: entry };
            }
        } catch (error) {
            throw new Error('Could not refresh current asset.');
        }
    });

    // ------------------------------------------------------------------------

    frontend.on('createFolder', async (args) => {
        try {
            let response = await Project.addFolder({ ...args });
            return { success: true, response };
        } catch (error) {
            throw new Error('Could not create folder.');
        }
    });

    // ------------------------------------------------------------------------

    frontend.on('getProjectsForBrand', async ({ brand }) => {
        try {
            let projects = await Project.getProjectsForBrand(brand);
            return { success: true, projects };
        } catch (error) {
            throw Error('Could not get projects for brand.');
        }
    });

    // ------------------------------------------------------------------------
    frontend.on('getProjectFolders', async (args) => {
        try {
            let { folder, folders } = await Project.getProjectFolders(args.project, args.folder);
            return { success: true, folder, folders };
        } catch (error) {
            throw Error('Could not get project folders.');
        }
    });

    // ------------------------------------------------------------------------

    frontend.on('getFilesAndFoldersForProjectAndFolder', async (args) => {
        try {
            let { folder, folders, files } = await Project.getFilesAndFoldersForProjectAndFolder(
                args.legacyProjectID,
                args.legacyFolderID
            );
            return { success: true, folder, folders, files };
        } catch (error) {
            throw Error('Could not get files and folders.');
        }
    });

    // ------------------------------------------------------------------------
    frontend.on('getSelectedArtboards', async ({ brandID }) => {
        try {
            // Performance issue: if useCachedSHA = false
            let useCachedSHA = true;
            let payload = actions['getSelectedArtboards'](brandID, useCachedSHA);
            return payload;
        } catch (error) {
            throw new Error('Could not get selected artboards.');
        }
    });

    // ------------------------------------------------------------------------
    frontend.on('getAssetDatabase', async () => {
        return { database: FileManager.getAssetDatabase() };
    });

    // ------------------------------------------------------------------------
    frontend.on('getOpenDocuments', async () => {
        var documents = sketch.getDocuments();
        return { documents };
    });

    // ------------------------------------------------------------------------
    frontend.on('getOpenDocumentsMeta', async () => {
        let openDocuments = sketch.getDocuments();
        let database = FileManager.getAssetDatabase();

        let openDocumentsMeta = openDocuments

            .map((document) => {
                let relativePath = Source.getRelativePath(document.path);

                if (!relativePath) {
                    return {
                        uuid: document.id,
                        path: '',
                        state: 'unsaved',
                    };
                }

                let transformedDocument = {
                    uuid: document.id,
                    filename: relativePath.split('/').pop().replaceAll('%20', ' '),
                    path: document.path,
                    relativePath: relativePath,
                    normalizedPath: document.path.replaceAll('%20', ' '),
                    normalizedRelativePath: relativePath.replaceAll('%20', ' '),
                    remote_modified: sketch.Settings.documentSettingForKey(document, 'remote_modified'),
                    ...database[document.id],
                };

                return transformedDocument;
            })
            .sort((a, b) => (a.name > b.name ? 1 : -1));

        return { success: true, documents: openDocumentsMeta };
    });

    // ------------------------------------------------------------------------
    frontend.on('getAuth', async () => {
        let auth = User.getAuthentication();

        if (auth) {
            return { success: true, auth };
        } else {
            return { success: false, error: 'Could not read crendetials from Sketch' };
        }
    });

    // ------------------------------------------------------------------------
    frontend.on('getLocalAndRemoteSourceFiles', async () => {
        try {
            let sources = await Source.getLocalAndRemoteSourceFiles();
            return { success: true, sources };
        } catch (error) {
            return { success: false, error };
        }
    });

    // ------------------------------------------------------------------------
    frontend.on('removeSelectedLayers', async () => {
        let document = sketch.getSelectedDocument();

        document.selectedLayers.forEach((layer) => {
            layer.remove();
        });

        return { success: true };
    });

    // ------------------------------------------------------------------------
    frontend.on('selectLayer', async ({ id }) => {
        let document = sketch.getSelectedDocument();

        document.selectedLayers.forEach((layer) => {
            layer.selected = false;
        });
        let layer = sketch.find(`[id="${id}"]`)[0];
        layer.selected = true;

        return { success: true };
    });

    // ------------------------------------------------------------------------
    frontend.on('getSelectedLayerFrames', async () => {
        let document = sketch.getSelectedDocument();

        let frames = [];
        document.selectedLayers.forEach((layer) => {
            if (layer.type != 'Artboard' && layer.style) {
                frames.push({
                    ...layer.frame,
                    type: layer.type,
                    id: layer.id,
                    hasImageFill: layer.style.fills.find((fill) => fill.pattern?.image),
                });
            }
        });

        return { success: true, frames };
    });

    // ------------------------------------------------------------------------
    frontend.on('logout', async () => {
        User.logout().then();
    });

    // ------------------------------------------------------------------------
    frontend.on('openUrl', async ({ absolute = true, url }) => {
        try {
            if (absolute) {
                NSWorkspace.sharedWorkspace().openURL(NSURL.URLWithString(url));
                return { success: true };
            } else {
                Target.getDomain().then(
                    function (data) {
                        NSWorkspace.sharedWorkspace().openURL(NSURL.URLWithString(data + url));
                        return { success: true };
                    }.bind(this)
                );
            }
        } catch (error) {
            throw new Error('Could not open URL.');
        }
    });

    // ------------------------------------------------------------------------

    frontend.on('moveCurrent', async ({ brand, project, folder }) => {
        try {
            await FileManager.moveCurrent(brand, project, folder);
            return { success: true };
        } catch (error) {
            throw new Error('Could not move file.');
        }
    });

    // ------------------------------------------------------------------------

    frontend.on('openSource', async ({ path }) => {
        try {
            await Source.openSourceAtPath(path);
        } catch (error) {
            throw new Error('Could not open source file.');
        }
    });

    // ------------------------------------------------------------------------
    frontend.on('resizeLayer', async ({ width, height }) => {
        try {
            await Asset.resize(width, height);
        } catch (error) {
            throw new Error('Could not resize layer.');
        }
    });

    // ------------------------------------------------------------------------
    frontend.on('convertBitmapToShape', async () => {
        let currentDocument = sketch.getSelectedDocument();
        let selection = currentDocument.selectedLayers.layers;

        if (selection) {
            let layer = selection[0];
            try {
                await Asset.convertBitmapToShape(layer);
            } catch (error) {
                throw new Error('Could not convert layer.');
            }
        }
    });

    // ------------------------------------------------------------------------
    frontend.on('pullSource', async ({ source, path }) => {
        try {
            /**
             * 1. Checkout file
             */

            // Patch the id. Better: use a consistent payload
            source.id = source.refs?.remote_id;

            let result = await Source.pullSource(source, path);

            // Close outdated document
            let openDocuments = sketch.getDocuments();
            openDocuments.forEach((document) => {
                if (document.id == source.uuid) {
                    //close
                    document.close();
                }
            });
            // Open path
            let document = await Source.openSketchFile(path);

            let uuid = document.id;
            let remoteId = sketch.Settings.documentSettingForKey(document, 'remote_id');
            // If the file has been uploaded through the old plugin, it won’t have an ID stored.
            // To make the file savable, we’ll add one.
            if (!remoteId) {
                sketch.Settings.setDocumentSettingForKey(document, 'remote_id', source.id);
            }

            let remote = await Source.getAssetForLegacyAssetID(source.id);

            Source.checkoutSource({ id_external: uuid, ...source, remote }, path);

            return { success: true, result };
        } catch (error) {
            throw new Error('Could not pull source file.');
        }
    });

    // ------------------------------------------------------------------------
    frontend.on('pushSource', async ({ source, target }) => {
        try {
            let result = await Source.pushSource(source, target);

            sketch.Settings.setDocumentSettingForKey(getDocument(), 'remote_modified', result.modified);

            // Mark document as clean, because there are no untracked changes
            sketch.Settings.setDocumentSettingForKey(getDocument(), 'dirty', false);

            return { success: true };
        } catch (error) {
            throw new Error('Could not push source file.');
        }
    });

    // ------------------------------------------------------------------------
    frontend.on('removeAllDestinations', async ({ id, brandID }) => {
        try {
            removeDestinations({ id: id });

            let artboardsAfterRemovingAllDestinations = getSelectedArtboards(brandID, false);

            frontend.send('artboards-changed', artboardsAfterRemovingAllDestinations);

            return { success: true };
        } catch (error) {
            throw new Error('Could not remove upload destinations.');
        }
    });

    // ------------------------------------------------------------------------
    frontend.on('removeDestination', async ({ id, destination, brandID }) => {
        try {
            removeDestination({ id: id }, destination);

            let artboardsAfterRemovingDestination = getSelectedArtboards(brandID, false);

            frontend.send('artboards-changed', artboardsAfterRemovingDestination);

            return { success: true };
        } catch (error) {
            throw new Error('Could not remove upload destination.');
        }
    });

    // ------------------------------------------------------------------------
    frontend.on('reveal', async ({ path }) => {
        try {
            if (createFolder(path)) {
                try {
                    NSWorkspace.sharedWorkspace().openFile(path);
                } catch (error) {
                    console.log(error);
                }
            }
        } catch (error) {
            throw new Error('Could not reveal folder.');
        }
    });

    // ------------------------------------------------------------------------
    frontend.on('revealFrontifyFolder', async ({ brand }) => {
        try {
            let base = Target.getPathToSyncFolder();
            let path = brand ? `${base}/${brand.name}` : base;
            if (createFolder(path)) {
                try {
                    NSWorkspace.sharedWorkspace().openFile(path);
                } catch (error) {
                    console.log(error);
                }
            }
        } catch (error) {
            throw new Error('Could not reveal Frontify folder.');
        }
    });

    // ------------------------------------------------------------------------
    frontend.on('setBrand', async ({ brandID }) => {
        try {
            Target.setBrand(brandID);
            frontend.send('brand-changed');
        } catch (error) {
            throw new Error('Changing brand failed.');
        }
    });

    // ------------------------------------------------------------------------
    frontend.on('uploadArtboards', async ({ artboards, brandID }) => {
        try {
            actions['uploadArtboards']({ artboards, brandID });
        } catch (error) {
            throw new Error('Uploading artboards failed.');
        }
    });

    // ------------------------------------------------------------------------

    return win;
}
