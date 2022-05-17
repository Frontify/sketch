import main from '../windows/main';
import executeSafely from '../helpers/executeSafely';
import source from '../model/source';
import { isWebviewPresent, sendToWebview } from 'sketch-module-web-view/remote';
import sketch from '../model/sketch';
const sketch3 = require('sketch');

import {
    getSelectedArtboards,
    getSelectedArtboardsFromSelection,
    setSHA,
} from '../windows/actions/getSelectedArtboards';

import { getPluginState } from '../windows/main';

import State from '../windows/State';

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

export function savedCommand(context) {
    console.log('saved!');
    executeSafely(context, function () {
        source.saved().then(function () {
            refresh();
        });
    });
}

export function closeCommand(context) {
    executeSafely(context, function () {
        source.closed().then(function () {
            refresh();
        });
    });
}

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

export function onDocumentChanged(context) {
    // mark documnt as dirty?
}

export function selectionChangedCommand(context) {
    if (activeDocumentDidChange()) refresh();
}

function sendSelection(brandID) {
    if (activeDocumentDidChange()) refresh();
    // let newSelection = context.actionContext.newSelection;
    // State.selectionChangedCommand(newSelection);
    // State.progressEvent({ artboard: State.getState().artboards[0], data: {} });
    let payload = getSelectedArtboards(brandID);

    frontend.send('artboards-changed', payload);
}

export function artboardChangedCommand(context) {
    let newArtboard = sketch3.fromNative(context.actionContext.newArtboard);

    // Update the SHA of the artboard
    setSHA(newArtboard);

    let threshold = 1000;

    let recentSelection = 'com.frontify.sketch.recent.selection.uuid';
    let recentBrand = 'com.frontify.sketch.recent.brand.id';
    // set uuid

    let contextUUID = '' + NSUUID.UUID().UUIDString();
    sketch3.Settings.setSessionVariable(recentSelection, contextUUID);

    setTimeout(() => {
        let mostRecentUUID = sketch3.Settings.sessionVariable(recentSelection);
        let mostRecentBrandID = sketch3.Settings.sessionVariable(recentBrand);
        if (mostRecentUUID == contextUUID) {
            executeSafely(context, function () {
                if (isWebviewPresent('frontifymain')) {
                    sendSelection(mostRecentBrandID);
                }
            });
        }
    }, threshold);
}

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
    // Send artboard information
    let recentBrand = 'com.frontify.sketch.recent.brand.id';
    let mostRecentBrandID = sketch3.Settings.sessionVariable(recentBrand);
    sendSelection(mostRecentBrandID);
}

// Identifier for the plugin window that we can use for message passing
const IDENTIFIER = 'frontifymain';
/**
 * We can use this helper to make it more convenient to send messages to the webview.
 */
const frontend = {
    send(type, payload) {
        sendToWebview(IDENTIFIER, `send(${JSON.stringify({ type, payload })})`);
    },
};
