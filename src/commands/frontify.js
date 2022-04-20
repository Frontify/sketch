import main from '../windows/main';
import executeSafely from '../helpers/executeSafely';
import source from '../model/source';
import { isWebviewPresent, sendToWebview } from 'sketch-module-web-view/remote';
import sketch from '../model/sketch';
const sketch3 = require('sketch');

import { getSelectedArtboards, getSelectedArtboardsFromSelection } from '../windows/actions/getSelectedArtboards';

import { getPluginState } from '../windows/main';

import State from '../windows/State';

console.log('frontify.js');

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

export function selectionChangedCommand(context) {
    let threshold = 1000;

    let key = 'com.frontify.sketch.recent.selection.uuid';
    // set uuid

    let contextUUID = '' + NSUUID.UUID().UUIDString();
    sketch3.Settings.setSessionVariable(key, contextUUID);

    const sendSelection = () => {
        if (activeDocumentDidChange()) refresh();
        // let newSelection = context.actionContext.newSelection;
        // State.selectionChangedCommand(newSelection);
        // State.progressEvent({ artboard: State.getState().artboards[0], data: {} });
        let payload = getSelectedArtboards();
        frontend.send('artboards-changed', payload);
    };

    setTimeout(() => {
        let mostRecentUUID = sketch3.Settings.sessionVariable(key);
        if (mostRecentUUID == contextUUID) {
            console.log('selection sent');
            executeSafely(context, function () {
                if (isWebviewPresent('frontifymain')) {
                    sendSelection();
                }
            });
        } else {
            console.log('canceled');
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
