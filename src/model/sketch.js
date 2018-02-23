import user from './user';

class Sketch {
    constructor() {
        this.context = null;
    }

    setContext(context) {
        this.context = context;
    }

    getViewData() {
        var data = {};

        if (user.isAuthenticated()) {
            data.url = require('../views/main.html');
            data.width = 480;
            data.height = 600;
        }
        else {
            data.url = require('../views/login.html');
            data.width = 360;
            data.height = 470;
        }

        return data;
    }

    resize(ui) {
        var viewData = this.getViewData();

        var frame = ui.panel.frame();

        frame.size.width = viewData.width;
        frame.size.height = viewData.height;

        ui.panel.setFrame_display_animate(frame, true, true);
    }

    // generic search functions (from https://medium.com/sketch-app-sources/sketch-plugin-snippets-for-plugin-developers-e9e1d2ab6827)
    findLayers(predicate, container, layerType) {
        var doc = NSDocumentController.sharedDocumentController().currentDocument();
        var scope;
        switch (layerType) {
            case MSPage :
                scope = doc.pages();
                return scope.filteredArrayUsingPredicate(predicate);
                break;

            case MSArtboardGroup :
                if (typeof container !== 'undefined' && container != nil) {
                    if (container.className == 'MSPage') {
                        scope = container.artboards();
                        return scope.filteredArrayUsingPredicate(predicate);
                    }
                } else {
                    // search all pages
                    var filteredArray = NSArray.array();
                    var loopPages = doc.pages().objectEnumerator(), page;
                    while (page = loopPages.nextObject()) {
                        scope = page.artboards();
                        filteredArray = filteredArray.arrayByAddingObjectsFromArray(scope.filteredArrayUsingPredicate(predicate));
                    }
                    return filteredArray;
                }
                break;

            default :
                if (typeof container !== 'undefined' && container != nil) {
                    scope = container.children();
                    return scope.filteredArrayUsingPredicate(predicate);
                } else {
                    // search all pages
                    var filteredArray = NSArray.array();
                    var loopPages = doc.pages().objectEnumerator(), page;
                    while (page = loopPages.nextObject()) {
                        scope = page.children();
                        filteredArray = filteredArray.arrayByAddingObjectsFromArray(scope.filteredArrayUsingPredicate(predicate));
                    }
                    return filteredArray;
                }
        }
        return NSArray.array(); // Return an empty array if no matches were found
    }

    findFirstLayer(predicate, container, layerType) {
        var filteredArray = this.findLayers(predicate, container, layerType);
        return filteredArray.firstObject();
    }
}

export default new Sketch();

