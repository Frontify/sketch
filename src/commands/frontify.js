import main from '../windows/main';
import executeSafely from '../helpers/executeSafely';
import source from '../model/source';
import { isWebviewPresent, sendToWebview } from 'sketch-module-web-view/remote';
import sketch3 from 'sketch';

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

export function selectionChangedCommand(context) {
    executeSafely(context, function () {
        if (isWebviewPresent('frontifymain')) {
            sendToWebview('frontifymain', 'selectionChanged()');

            let layers = context.actionContext.document.selectedLayers().layers().slice();
            let layerInformation = layers.map((layer) => {
                let nativeLayer = sketch3.fromNative(layer);
                return `${nativeLayer.name} (${nativeLayer.id}`;
            });
            layers.forEach((layer) => {
                view.send('sketch.document.selection', `${layers.length} layers: ${layerInformation}`);
            });
        }
    });
}

function refresh() {
    if (isWebviewPresent('frontifymain')) {
        sendToWebview('frontifymain', 'refresh()');
    }
}
/**
 * We can use this helper to make it more convenient to send messages to the webview.
 */
const view = {
    send(type, payload) {
        sendToWebview('frontifymain', `send(${JSON.stringify(payload)})`);
    },
};
