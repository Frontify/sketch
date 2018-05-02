import main from '../windows/main';
import executeSafely from '../helpers/executeSafely';
import source from '../model/source';

var threadDictionary = NSThread.mainThread().threadDictionary();

export function runCommand(context) {
    COScript.currentCOScript().setShouldKeepAround(true);

    executeSafely(context, function () {
        threadDictionary['frontifymainui'] = main(context, 'artboards');
        threadDictionary['frontifymainui'].selectionChanged(context);
    });
}

export function openCommand(context) {
    COScript.currentCOScript().setShouldKeepAround(true);

    executeSafely(context, function () {
        var interval = setInterval(function () {
            if (context.actionContext.document.documentWindow()) {
                clearInterval(interval);
                source.opened().then(function () {
                    refresh();
                }.bind(this));
            }
        }, 200);
    });
}

export function savedCommand(context) {
    COScript.currentCOScript().setShouldKeepAround(true);

    executeSafely(context, function () {
        source.saved().then(function () {
            refresh();
        }.bind(this));
    });
}

export function closeCommand(context) {
    COScript.currentCOScript().setShouldKeepAround(true);

    executeSafely(context, function () {
        source.closed().then(function () {
            refresh();
        }.bind(this));

    });
}

export function selectionCommand(context) {
    COScript.currentCOScript().setShouldKeepAround(true);

    executeSafely(context, function () {
        if (threadDictionary['frontifymainui']) {
            threadDictionary['frontifymainui'].selectionChanged(context.actionContext);
        }
    });
}

function refresh() {
    if (threadDictionary['frontifymainui']) {
        threadDictionary['frontifymainui'].refresh();
    }
}