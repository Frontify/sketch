import main from '../windows/main';
import executeSafely from '../helpers/executeSafely';
import source from '../model/source';
import { isWebviewPresent } from 'sketch-module-web-view/remote';
const sketch3 = require('sketch');

import { frontend } from '../helpers/ipc';

import { getSelectedArtboards, setSHA } from '../windows/actions/getSelectedArtboards';

import { getPluginState } from '../windows/main';

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
                source.opened().then(function () {
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
        source.saved(context).then(function () {
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
            source.closed().then(function () {
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
    let oldDocumentID = sketch3.Settings.sessionVariable(key);

    let newDocument = sketch3.Document.getSelectedDocument();

    if (newDocument) {
        let newDocumentID = newDocument.id;
        sketch3.Settings.setSessionVariable(key, newDocumentID);

        if (oldDocumentID != newDocumentID) {
            // refresh
            return true;
        }
    }
    return false;
}

/**
 * Document changed
 * ----------------------------------------------------------------------------
 */

export function onDocumentChanged(context) {
    // mark documnt as dirty?
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
    let newArtboard = sketch3.fromNative(context.actionContext.newArtboard);

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
    sketch3.Settings.setSessionVariable(keyForMostRecentAction, actionUUID);

    setTimeout(() => {
        let mostRecentUUID = sketch3.Settings.sessionVariable(keyForMostRecentAction);
        let mostRecentBrandID = sketch3.Settings.sessionVariable(recentBrand);
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

    if (isWebviewPresent('frontifymain')) {
        frontend.send('refresh', payload);
    }
    // Send artboard information, if there is a document
    // If no document is open, then do nothing.

    let recentBrand = 'com.frontify.sketch.recent.brand.id';
    let mostRecentBrandID = sketch3.Settings.sessionVariable(recentBrand);
    sendSelection(mostRecentBrandID);
}

/**
 * Function: Send Selection
 * ----------------------------------------------------------------------------
 */

function sendSelection(brandID) {
    if (activeDocumentDidChange()) refresh();

    let payload = getSelectedArtboards(brandID);

    frontend.send('artboards-changed', payload);
}
