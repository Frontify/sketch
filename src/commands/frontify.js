import main from '../windows/main';
import executeSafely from '../helpers/executeSafely';

var threadDictionary = NSThread.mainThread().threadDictionary();

export function runCommand(context) {
    COScript.currentCOScript().setShouldKeepAround(true);

    executeSafely(context, function () {
        threadDictionary['frontifymainui'] = main(context, 'artboards');
    });
}

export function initCommand(context) {
    COScript.currentCOScript().setShouldKeepAround(true);

    executeSafely(context, function () {
        refresh();
    });
}

export function savedCommand(context) {
    COScript.currentCOScript().setShouldKeepAround(true);

    executeSafely(context, function () {
        refresh();
    });
}

export function closeCommand(context) {
    COScript.currentCOScript().setShouldKeepAround(true);

    executeSafely(context, function () {
        refresh();
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

