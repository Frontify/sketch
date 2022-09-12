// Sketch API
import sketch, { Settings } from 'sketch';

// Windows
import main from '../windows/main';

// Models
import Artboard from '../model/artboard';
import Notification from '../model/notification';
import Source from '../model/source';
import Target from '../model/target';

// IPC
import { frontend } from '../helpers/ipc';
import executeSafely from '../helpers/executeSafely';
import { isWebviewPresent } from 'sketch-module-web-view/remote';

import { Profiler } from '../model/Profiler';

const profiler = new Profiler();

/**
 * Run
 * ----------------------------------------------------------------------------
 */

export function runCommand(context) {
    let threadDictionary = NSThread.mainThread().threadDictionary();

    executeSafely(context, function () {
        if (!threadDictionary['frontifywindow']) {
            threadDictionary['frontifywindow'] = main(context, 'artboards');
        } else {
            threadDictionary['frontifywindow'].close();
        }
    });
}

/**
 * Open
 * ----------------------------------------------------------------------------
 */

export function openCommand(context) {
    executeSafely(context, function () {
        let interval = setInterval(function () {
            if (context.actionContext.document.documentWindow()) {
                clearInterval(interval);

                Source.opened().then(function (asset) {
                    // Notification.disconnect();
                    // Notification.listen();
                    if (asset && asset.refs) {
                        Notification.subscribe(asset.refs.remote_project_id);
                    }
                    refresh();
                });
            }
        }, 200);
    });
}

/**
 * Save
 * ----------------------------------------------------------------------------
 */

export function savedCommand(context) {
    executeSafely(context, function () {
        Source.saved(context).then(function () {
            if (isWebviewPresent('frontifymain')) {
                frontend.send('refresh');
            }
        });
    });
}

/**
 * Close
 * ----------------------------------------------------------------------------
 */

export function closeCommand(context) {
    executeSafely(context, function () {
        let interval = setInterval(function () {
            clearInterval(interval);
            Source.closed().then(function () {
                refresh();
            });
        }, 200);
    });
}

/**
 * Open
 * ----------------------------------------------------------------------------
 */

function activeDocumentDidChange() {
    let key = 'com.frontify.sketch.recent.document';
    let oldDocumentID = sketch.Settings.sessionVariable(key);

    let newDocument = sketch.Document.getSelectedDocument();

    if (newDocument) {
        let newDocumentID = newDocument.id;
        sketch.Settings.setSessionVariable(key, newDocumentID);

        if (oldDocumentID != newDocumentID) {
            // refresh

            return true;
        }
    }
    return false;
}

/**
 * Selection changed
 * ----------------------------------------------------------------------------
 */

function getSelectedArtboardsAndSymbolsFromDocument(nativeDocument) {
    let layers = nativeDocument.selectedLayers();
    let artboardsAndSymbols = [];
    for (var i = 0; i < layers.count(); i++) {
        let layer = layers[i];
        let type = String(layer.class());
        if (type == 'MSArtboardGroup' || type == 'MSSymbolMaster') {
            artboardsAndSymbols.push(layer);
        }
    }
    return artboardsAndSymbols;
}

export function artboardChangedFinishCommand(context) {
    // Return early to not degrade performance when the plugin isn’t running, but the action handler is still called
    if (!isWebviewPresent('frontifymain')) return;
    profiler.start('selection changed');

    let items = getSelectedArtboardsAndSymbolsFromDocument(context.actionContext.document);

    let ids = [];
    for (var i = 0; i < items.length; i++) {
        ids.push(String(items[i].objectID()));
    }

    frontend.send('artboard-selection-changed', { selection: ids, count: items.length });

    if (activeDocumentDidChange()) {
        frontend.send('getCurrentDocument');
        refresh();
    }
    profiler.end();
}

/**
 *
 * Extracts indices for page and artboard from "internalFullPath" from a "documentChanged" command
 * e.g. pages[0].layers[1].exportOptions.exportFormats
 *
 * @param {*} internalFullPath
 * @returns Object {page: 0, artboard: 1}
 */
function getIndicesFromPath(internalFullPath) {
    let parts = internalFullPath.split('.');
    let page = parseInt(parts[0].replace('pages[', '').replace(']', ''));
    let artboard = parseInt(parts[1].replace('layers[', '').replace(']', ''));
    return {
        page,
        artboard,
    };
}

// function markDocumentAsDirtyAfterDocumentChange() {
//     let document = sketch.getSelectedDocument();
//     let isDocumentDirty = Settings.documentSettingForKey(document, 'dirty');
//     if (!isDocumentDirty) {
//         Source.saved(context);
//         frontend.fire('getCurrentDocument');
//     }
// }

export function documentChangedCommand(context) {
    // Return early to not degrade performance when the plugin isn’t running, but the action handler is still called
    if (!isWebviewPresent('frontifymain')) return;

    profiler.start('documentChangedCommand');
    var changes = context.actionContext;
    let shouldRefresh = false;
    for (var i = 0; i < changes.length; i++) {
        var change = changes[i];

        var obj = change.object();

        let layer = null;
        layer = sketch.fromNative(obj);

        if (!layer.type) {
            // If a style, opacity, color, override, export option or similar has changed, then
            // the JS API can’t convert it. It warns "no mapped wrapper for MSExportOptions".
            // What we still get is the "internalFullPath", a String, from which we can try to
            // access to actual layer by getting the page and artboard index by splitting the String.
            let indices = getIndicesFromPath(change.internalFullPath());
            layer = sketch.getSelectedDocument().pages[indices.page].layers[indices.artboard];
        }

        let didFlag = flagParentArtboardAsDirty(layer);
        if (didFlag) {
            shouldRefresh = true;
        }
    }
    if (shouldRefresh) {
        refresh();
    }

    profiler.end();
}

function flagParentArtboardAsDirty(layer) {
    if (layer) {
        // we’re using try/catch here because a layer that has been removed won’t have a method "getParentArtboard()"
        try {
            let artboard = layer.type == 'Artboard' || layer.type == 'SymbolMaster' ? layer : layer.getParentArtboard();

            if (artboard) {
                let currentState = Settings.layerSettingForKey(artboard, 'dirty');
                if (currentState == false) {
                    Settings.setLayerSettingForKey(artboard, 'dirty', true);
                    return true;
                }
            }
        } catch (error) {
            // We’ll catch cases where we know the layer, but "getParentArtboard()" is not a method which is the case for removed layers
            // We assume that Sketch selects sibling layers of the same artboard / symbol and we use that to figure out what to mark as dirty
            sketch.getSelectedDocument().selectedLayers.forEach((layer) => {
                try {
                    Settings.setLayerSettingForKey(layer.getParentArtboard(), 'dirty', true);
                } catch (error) {}
            });
            return true;
        }
    }
    return false;
}

/**
 * Function: Refresh
 * ----------------------------------------------------------------------------
 */
export function layerRenamedCommand(context) {
    // doesn’t work
    refresh();
}
export function refresh() {
    let recentBrand = 'com.frontify.sketch.recent.brand.id';
    let mostRecentBrandID = sketch.Settings.sessionVariable(recentBrand);

    if (isWebviewPresent('frontifymain')) {
        // frontend.send('refresh');
    }

    sendSelection(mostRecentBrandID);
}

/**
 * Function: Send Selection
 * ----------------------------------------------------------------------------
 */

function sendSelection(brandID) {
    // if (activeDocumentDidChange()) refresh();

    let payload = Artboard.getTrackedArtboardsAndSymbols(brandID, true);

    frontend.send('artboards-changed', payload);
}
