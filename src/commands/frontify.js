import main from '../windows/main';
import artboard from '../model/artboard';
import project from '../model/project';
import filemanager from '../model/filemanager';
import source from '../model/source';
import target from '../model/target';
import user from '../model/user';
import sketch from '../model/sketch';
import executeSafely from '../helpers/executeSafely';

var threadDictionary = NSThread.mainThread().threadDictionary();
var MochaJSDelegate = require('mocha-js-delegate');

export function runCommand(context) {
    COScript.currentCOScript().setShouldKeepAround(true);

    executeSafely(context, function () {
        setContext(context);
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

function refresh() {
   if (threadDictionary['frontifymainui']) {
       threadDictionary['frontifymainui'].eval('refresh()');
   }
}

function setContext(context) {
    // init model singletons
    artboard.setContext(context);
    project.setContext(context);
    filemanager.setContext(context);
    source.setContext(context);
    target.setContext(context);
    user.setContext(context);
    sketch.setContext(context);
}

