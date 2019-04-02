import target from './target';
import fetch from '../helpers/fetch';
import sketch from './sketch';
import { isWebviewPresent, sendToWebview } from 'sketch-module-web-view/remote'

var api = require('sketch');
var dom = require('sketch/dom');

class Asset {
    constructor() {

    }

    searchAssets(type, filters, query) {
        return target.getSelectedAssetSourceForType(type).then(function(assetSource) {
            // search assets
            var url = '/v1/assets/search/';
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

    applyImage(data) {
        if(data.url && data.ext) {
            var url = data.url.replace('{width}', 2000);
            var ext = data.ext;

            var jsdoc = dom.Document.fromNative(sketch.getDocument());

            if(ext !== 'svg') {
                var image = NSImage.alloc().initWithContentsOfURL(NSURL.URLWithString(url));
                var imageLayer = new dom.Image({ image: image });

                if(imageLayer && imageLayer.image) {
                    var imageData = imageLayer.image;
                    var app = NSApp.delegate();

                    jsdoc.selectedLayers.forEach(function(layer) {
                        // check whether layer is a shape
                        if(layer.type != 'Artboard' && layer.style) {
                            layer.style.fills = [
                                {
                                    fill: api.Style.FillType.Pattern,
                                    pattern: {
                                        patternType: api.Style.PatternFillType.Fill,
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
                    var app = NSApp.delegate();

                    var svg = NSString.stringWithString(blob);
                    var svgData = svg.dataUsingEncoding(NSUTF8StringEncoding);

                    var importer = MSSVGImporter.svgImporter();

                    importer.prepareToImportFromData(svgData);
                    var layer = importer.importAsLayer();

                    var jsLayer = dom.Group.fromNative(layer).layers[0];
                    jsLayer.name = data.title || 'SVG';

                    var parent = null;

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

