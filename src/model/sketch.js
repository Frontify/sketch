import user from './user';

class Sketch {
    constructor() {}

    getViewData() {
        // Note: Here we used to switch the entry of the frontend based on the authentication state.
        // With the React setup and router, we will always load the same entry, thus we need to make the switch on the
        // frontend instead.

        // let data = {};
        // if (user.isAuthenticated()) {
        //     // data.url = '/source/artboards';
        //     data.url = '';
        //     data.width = 480;
        //     data.height = 600;
        // } else {
        //     data.url = '/source';
        //     data.width = 360;
        //     data.height = 530;
        // }

        return {
            url: '',
            width: 480,
            height: 600,
        };
    }

    resize(win) {
        let viewData = this.getViewData();
        win.setSize(viewData.width, viewData.height, true);
    }

    // generic search functions (from https://medium.com/sketch-app-sources/sketch-plugin-snippets-for-plugin-developers-e9e1d2ab6827)
    findLayers(predicate, container, layerType, doc) {
        doc = doc || this.getDocument();
        if (!doc) {
            return NSArray.array();
        }

        let scope;
        switch (layerType) {
            case MSPage:
                scope = doc.pages();
                return scope.filteredArrayUsingPredicate(predicate);
                break;

            case MSArtboardGroup:
                if (typeof container !== 'undefined' && container != nil) {
                    if (container.className == 'MSPage') {
                        scope = container.artboards();
                        return scope.filteredArrayUsingPredicate(predicate);
                    }
                } else {
                    // search all pages
                    let filteredArray = NSArray.array();
                    let loopPages = doc.pages().objectEnumerator(),
                        page;
                    while ((page = loopPages.nextObject())) {
                        scope = page.artboards();
                        filteredArray = filteredArray.arrayByAddingObjectsFromArray(
                            scope.filteredArrayUsingPredicate(predicate)
                        );
                    }
                    return filteredArray;
                }
                break;

            default:
                if (typeof container !== 'undefined' && container != nil) {
                    scope = container.children();
                    return scope.filteredArrayUsingPredicate(predicate);
                } else {
                    // search all pages
                    let filteredArray = NSArray.array();
                    let loopPages = doc.pages().objectEnumerator(),
                        page;
                    while ((page = loopPages.nextObject())) {
                        scope = page.children();
                        filteredArray = filteredArray.arrayByAddingObjectsFromArray(
                            scope.filteredArrayUsingPredicate(predicate)
                        );
                    }
                    return filteredArray;
                }
        }
        return NSArray.array(); // Return an empty array if no matches were found
    }

    findFirstLayer(predicate, container, layerType, doc) {
        let filteredArray = this.findLayers(predicate, container, layerType, doc);
        return filteredArray.firstObject();
    }

    getSelection() {
        let doc = this.getDocument();
        if (!doc) {
            return NSArray.array();
        }

        return doc.selectedLayers().layers();
    }

    getDocument() {
        return NSDocumentController.sharedDocumentController().currentDocument();
    }
}

export default new Sketch();
