import { isWebviewPresent, sendToWebview } from 'sketch-module-web-view/remote';

// Identifier for the plugin window that we can use for message passing
const IDENTIFIER = 'frontifymain';
/**
 * We can use this helper to make it more convenient to send messages to the webview.
 */
export const frontend = {
    listeners: {},
    send(type, payload) {
        if (isWebviewPresent('frontifymain')) {
            sendToWebview(IDENTIFIER, `send(${JSON.stringify({ type, payload })})`);
        }
    },
    on(type, callback) {
        this.listeners[type] = async (args) => {
            try {
                let response = await callback(args);

                if (args.requestUUID) {
                    this.send('response', { type, responseUUID: args.requestUUID, success: true, ...response });
                }
            } catch (error) {
                this.send('response', { type, responseUUID: args.requestUUID, success: false, error: error });

                // Throwing errors here will trigger an error dialog in the frontend.
                this.send('error', { type, responseUUID: args.requestUUID, error: error.message });
            }
        };
    },
    async fire(type, args) {
        if (type in this.listeners) {
            this.listeners[type](args);
        }
    },
};
