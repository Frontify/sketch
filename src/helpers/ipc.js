import { isWebviewPresent, sendToWebview } from 'sketch-module-web-view/remote';

// Identifier for the plugin window that we can use for message passing
const IDENTIFIER = 'frontifymain';
/**
 * We can use this helper to make it more convenient to send messages to the webview.
 */
export const frontend = {
    send(type, payload) {
        if (isWebviewPresent('frontifymain')) {
            sendToWebview(IDENTIFIER, `send(${JSON.stringify({ type, payload })})`);
        }
    },
};
