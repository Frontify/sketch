import createFolder from './createFolder'

var fileManager = NSFileManager.defaultManager();

export default function (path, data) {
    var parts = path.split('/');
    parts.pop();
    var folder = parts.join('/');

    if(createFolder(folder)) {
        data.writeToFile_atomically_(path, true);
    }

    return path;
}