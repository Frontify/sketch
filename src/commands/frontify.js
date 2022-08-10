// Sketch API
import sketch from 'sketch';

// Windows
import main from '../windows/main';

// Models
import Notification from '../model/notification';
import Source from '../model/source';

// IPC
import { frontend } from '../helpers/ipc';
import executeSafely from '../helpers/executeSafely';
import { isWebviewPresent } from 'sketch-module-web-view/remote';

import { getSelectedArtboards, setSHA } from '../windows/actions/getSelectedArtboards';

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
            refresh();
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

export function selectionChangedCommand(context) {
    frontend.send('selection-changed');
    if (activeDocumentDidChange()) refresh();
}

/**
 * Artboard changed
 * ----------------------------------------------------------------------------
 */

export function artboardChangedCommand(context) {
    let newArtboard = sketch.fromNative(context.actionContext.newArtboard);

    // Update the SHA of the artboard
    setSHA(newArtboard);

    let threshold = 1000;

    /**
     * We’re throttling this action to improve performance. Otherwise, quickly selecting artboards over
     * and over again could slow down the application.
     *
     * # Problem: clearTimeout() not available…
     *
     * There’s not really a way (or is it?) to cancel timeouts in Sketch because the previous JavaScript
     * context is lost when a command runs. That means, we do not have a reference to the timeout anymore.
     *
     * That means that the callback of the timeout will in fact always fire.
     * To prevent the effects of the timeout to run (expensive!), we check if it is the most recent callback
     * and only then execute the callback and do the expensive calculations.
     *
     * # Implementation using UUIDs for every action run
     *
     * We’re generating a UUID every time this action runs. We then store it as a session variable.
     * After the timeout, we can then compare the UUID of the callback with the UUID of the most recent action
     * that is stored as a session variable.
     *
     */
    let keyForMostRecentAction = 'com.frontify.sketch.recent.action.uuid';
    let recentBrand = 'com.frontify.sketch.recent.brand.id';

    // set uuid
    let actionUUID = '' + NSUUID.UUID().UUIDString();
    sketch.Settings.setSessionVariable(keyForMostRecentAction, actionUUID);

    setTimeout(() => {
        let mostRecentUUID = sketch.Settings.sessionVariable(keyForMostRecentAction);
        let mostRecentBrandID = sketch.Settings.sessionVariable(recentBrand);
        if (mostRecentUUID == actionUUID) {
            executeSafely(context, function () {
                if (isWebviewPresent('frontifymain')) {
                    sendSelection(mostRecentBrandID);
                }
            });
        }
    }, threshold);
}

/**
 * Function: Refresh
 * ----------------------------------------------------------------------------
 */
export function layerRenamedCommand(context) {
    console.log('layer renmaed');
    refresh();
}
export function refresh() {
    console.log('refresh');
    let recentBrand = 'com.frontify.sketch.recent.brand.id';
    let mostRecentBrandID = sketch.Settings.sessionVariable(recentBrand);

    if (isWebviewPresent('frontifymain')) {
        frontend.send('refresh');
    }

    sendSelection(mostRecentBrandID);
}

/**
 * Function: Send Selection
 * ----------------------------------------------------------------------------
 */

function sendSelection(brandID) {
    if (activeDocumentDidChange()) refresh();

    let payload = getSelectedArtboards(brandID, true);

    frontend.send('artboards-changed', payload);
}
