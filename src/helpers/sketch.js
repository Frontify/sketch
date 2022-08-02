export function findLayers(predicate, container, layerType, doc) {
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

export function findFirstLayer(predicate, container, layerType, doc) {
    let filteredArray = findLayers(predicate, container, layerType, doc);
    return filteredArray.firstObject();
}

export function getDocument() {
    return NSDocumentController.sharedDocumentController().currentDocument();
}
