import target from './target';
import fetch from '../helpers/fetch';
import sketch from './sketch';
import { isWebviewPresent, sendToWebview } from 'sketch-module-web-view/remote';

let API = require('sketch');
let DOM = require('sketch/dom');

class Asset {
    constructor() {}

    searchAssets(type, query) {
        return target.getSelectedAssetSourceForType(type).then(
            function (assetSource) {
                // search assets
                let url = '/v1/assets/search/';
                if (assetSource.implicit_access) {
                    url += assetSource.connected_document_id + '?' + query;
                } else {
                    url += '?project_id=' + assetSource.id + '&' + query;
                }

                if (query === '') {
                    url += '&limit=100';
                }

                return fetch(url).then(
                    function (data) {
                        return data;
                    }.bind(this)
                );
            }.bind(this)
        );
    }

    search(type, query) {
        this.searchAssets(type, query).then(
            function (data) {
                if (data.success) {
                    if (isWebviewPresent('frontifymain')) {
                        sendToWebview(
                            'frontifymain',
                            'showLibraryAssets(' + JSON.stringify({ type: type, assets: data.data }) + ')'
                        );
                    }
                }
            }.bind(this)
        );
    }

    import(assetId) {
        const url = '/v1/inspect/import/' + assetId;
        return fetch(url, { method: 'GET' });
    }

    applyImage(data) {
        if (data.url && data.ext) {
            let url = data.url.replace('{width}', 2000);
            let ext = data.ext;

            let jsdoc = DOM.Document.fromNative(sketch.getDocument());

            if (ext !== 'svg') {
                let image = NSImage.alloc().initWithContentsOfURL(NSURL.URLWithString(url));
                let imageLayer = new DOM.Image({ image: image });
                let imageSize = image.size();

                if (imageLayer && imageLayer.image) {
                    imageLayer.frame.width = imageSize.width;
                    imageLayer.frame.height = imageSize.height;

                    let imageData = imageLayer.image;
                    let applied = false;

                    jsdoc.selectedLayers.forEach(
                        function (layer) {
                            // check whether layer is a shape
                            if (layer.type != 'Artboard' && layer.style) {
                                applied = true;
                                layer.style.fills = [
                                    {
                                        fill: API.Style.FillType.Pattern,
                                        pattern: {
                                            patternType: API.Style.PatternFillType.Fill,
                                            image: imageData,
                                        },
                                    },
                                ];
                            }
                        }.bind(this)
                    );

                    if (!applied) {
                        // no appropriate layer has been selected -> add to document
                        let parent = null;

                        jsdoc.selectedLayers.forEach(
                            function (layer) {
                                if (layer.type == 'Artboard') {
                                    parent = layer;
                                }
                            }.bind(this)
                        );

                        if (parent) {
                            imageLayer.parent = parent;

                            let ratio = imageSize.height / imageSize.width;

                            imageLayer.frame.width = parent.frame.width;
                            imageLayer.frame.height = ratio * parent.frame.width;
                        } else {
                            imageLayer.parent = jsdoc.selectedPage;
                        }

                        imageLayer.selected = true;
                        jsdoc.centerOnLayer(imageLayer);
                        jsdoc.sketchObject.eventHandlerManager().currentHandler().zoomToSelection();
                    }
                }
            } else {
                fetch(url, { cdn: true })
                    .then(
                        function (blob) {
                            let svg = NSString.stringWithString(blob);
                            let svgData = svg.dataUsingEncoding(NSUTF8StringEncoding);

                            let importer = MSSVGImporter.svgImporter();

                            importer.prepareToImportFromData(svgData);
                            let layer = importer.importAsLayer();

                            let jsLayer = DOM.Group.fromNative(layer).layers[0];
                            jsLayer.name = data.title || 'SVG';

                            let parent = null;

                            jsdoc.selectedLayers.forEach(
                                function (selectedLayer) {
                                    if (!parent && selectedLayer.type == 'Artboard') {
                                        parent = selectedLayer;
                                    }
                                }.bind(this)
                            );

                            if (!parent) {
                                parent = jsdoc.selectedPage;
                            }

                            jsLayer.parent = parent;

                            jsLayer.selected = true;
                            jsdoc.centerOnLayer(jsLayer);
                            jsdoc.sketchObject.eventHandlerManager().currentHandler().zoomToSelection();
                        }.bind(this)
                    )
                    .catch(
                        function (e) {
                            console.error(e);
                        }.bind(this)
                    );
            }
        }
    }
}

export default new Asset();
