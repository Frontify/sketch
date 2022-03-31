import main from '../windows/main';
import executeSafely from '../helpers/executeSafely';
import source from '../model/source';
import { isWebviewPresent, sendToWebview } from 'sketch-module-web-view/remote';
const sketch3 = require('sketch');

import { getPluginState } from '../windows/main';

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
    console.log('document: opened');
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
    console.log('document: saved');
    executeSafely(context, function () {
        source.saved().then(function () {
            refresh();
        });
    });
}

export function closeCommand(context) {
    console.log('document: closed');
    executeSafely(context, function () {
        source.closed().then(function () {
            refresh();
        });
    });
}

export function selectionChangedCommand(context) {
    executeSafely(context, function () {
        if (isWebviewPresent('frontifymain')) {
            let key = 'com.frontify.sketch.recent.document';
            let oldDocumentID = sketch3.Settings.sessionVariable(key);

            let newDocument = sketch3.Document.getSelectedDocument();
            if (newDocument) {
                let newDocumentID = newDocument.id;
                sketch3.Settings.setSessionVariable(key, newDocumentID);

                if (oldDocumentID != newDocumentID) {
                    // refresh
                    refresh();
                }
            }

            console.log('Reading session variable…', documentID);
        }
    });
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
        console.log('send to frontend', type, payload);
        sendToWebview(IDENTIFIER, `send(${JSON.stringify({ type, payload })})`);
    },
};
