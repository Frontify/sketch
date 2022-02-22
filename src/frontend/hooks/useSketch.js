/**
 * This hook can be used to communicate with Sketch.
 * Available message types can be found in "main.js" -> webview.on('request', ...)
 *
 * Usage: let { documents } = await useSketch("getOpenDocuments")
 */
export async function useSketch(type, args) {
    const UUIDGeneratorBrowser = () =>
        ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
            (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
        );

    return new Promise(async (resolve, reject) => {
        const requestUUID = UUIDGeneratorBrowser();
        console.log('request', requestUUID);
        window.postMessage('request', { type, requestUUID, args });

        const handler = (event) => {
            let { type, payload } = event.detail.data;

            if (type == 'response' && requestUUID == payload.responseUUID) {
                console.log('resolve', requestUUID);
                resolve(payload);
            }

            window.removeEventListener('send-data', handler);
        };

        window.addEventListener('send-data', handler);
    });
}
