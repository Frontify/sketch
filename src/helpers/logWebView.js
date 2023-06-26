import { isWebviewPresent, sendToWebview } from 'sketch-module-web-view/remote';
export default function logWebView(data) {
    if (isWebviewPresent('frontifymain')) {
        sendToWebview('frontifymain', 'log(' + JSON.stringify(data) + ')');
    }
}
