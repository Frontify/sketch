import target from './target';
import fetch from '../helpers/fetch';
import sketch from './sketch';
import { isWebviewPresent, sendToWebview } from 'sketch-module-web-view/remote'

let API = require('sketch');
let DOM = require('sketch/dom');

class Asset {
    constructor() {

    }

    searchAssets(type, filters, query) {
        return target.getSelectedAssetSourceForType(type).then(function(assetSource) {
            // search assets
            let url = '/v1/assets/search/';
            if(assetSource.connected_document_id) {
                url += assetSource.connected_document_id + '?' + query;
            }
            else {
                url += '?project_id=' + assetSource.id + '&' + query;
            }

            return fetch(url).then(function (data) {
                return data;
            }.bind(this));
        }.bind(this));
    }

    search(type, filters, query) {
        this.searchAssets(type, filters, query).then(function (data) {
            if(data.success) {
                if (isWebviewPresent('frontifymain')) {
                    sendToWebview('frontifymain', 'showLibraryAssets(' + JSON.stringify({ type: type, assets: data.data }) + ')');
                }
            }
        }.bind(this));
    }

    import(assetId) {
        const url = '/v1/inspect/import/' + assetId;
        return fetch(url, { method: 'GET' });
    }

    applyImage(data) {
        if(data.url && data.ext) {
            let url = data.url.replace('{width}', 2000);
            let ext = data.ext;

            let jsdoc = DOM.Document.fromNative(sketch.getDocument());

            if(ext !== 'svg') {
                let image = NSImage.alloc().initWithContentsOfURL(NSURL.URLWithString(url));
                let imageLayer = new DOM.Image({ image: image });

                if(imageLayer && imageLayer.image) {
                    let imageData = imageLayer.image;
                    let app = NSApp.delegate();

                    jsdoc.selectedLayers.forEach(function(layer) {
                        // check whether layer is a shape
                        if(layer.type != 'Artboard' && layer.style) {
                            layer.style.fills = [
                                {
                                    fill: API.Style.FillType.Pattern,
                                    pattern: {
                                        patternType: API.Style.PatternFillType.Fill,
                                        image: imageData
                                    }
                                }
                            ];
                        }

                    }.bind(this));

                    app.refreshCurrentDocument();
                }
            } else {
                fetch(url, { cdn : true }).then(function (blob) {
                    let app = NSApp.delegate();

                    let svg = NSString.stringWithString(blob);
                    let svgData = svg.dataUsingEncoding(NSUTF8StringEncoding);

                    let importer = MSSVGImporter.svgImporter();

                    importer.prepareToImportFromData(svgData);
                    let layer = importer.importAsLayer();

                    let jsLayer = DOM.Group.fromNative(layer).layers[0];
                    jsLayer.name = data.title || 'SVG';

                    let parent = null;

                    jsdoc.selectedLayers.forEach(function(selectedLayer) {
                        if(!parent && selectedLayer.type == 'Artboard') {
                            parent = selectedLayer;
                        }
                    }.bind(this));

                    if(!parent) {
                        parent = jsdoc.selectedPage;
                    }

                    jsLayer.parent = parent;

                    app.refreshCurrentDocument();
                }.bind(this)).catch(function(e) {
                    console.error(e);
                }.bind(this));
            }
        }
    }
}

export default new Asset();

