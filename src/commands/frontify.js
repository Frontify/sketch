import main from '../windows/main';
import executeSafely from '../helpers/executeSafely';
import source from '../model/source';

export function runCommand(context) {
    var threadDictionary = NSThread.mainThread().threadDictionary();

    executeSafely(context, function () {
        if(!threadDictionary['frontifymainui']) {
            threadDictionary['frontifymainui'] = main(context, 'artboards');
        }
        else {
            threadDictionary['frontifymainui'].close();
        }
    });
}

export function openCommand(context) {
    executeSafely(context, function () {
        var interval = setInterval(function () {
            if (context.actionContext.document.documentWindow()) {
                clearInterval(interval);
                source.opened().then(function () {
                    refresh();
                });
            }
        }, 200);
    });
}

export function savedCommand(context) {
    executeSafely(context, function () {
        source.saved().then(function () {
            refresh();
        });
    });
}

export function closeCommand(context) {
    executeSafely(context, function () {
        source.closed().then(function () {
            refresh();
        });
    });
}

function refresh() {
    var threadDictionary = NSThread.mainThread().threadDictionary();

    if (threadDictionary['frontifymainui']) {
        threadDictionary['frontifymainui'].eval('refresh()');
    }
}
