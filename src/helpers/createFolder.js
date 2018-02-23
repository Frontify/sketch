var fileManager = NSFileManager.defaultManager();

export default function (path) {
    var parts = path.split('/');
    var folder = parts.join('/');

    if (!fileManager.fileExistsAtPath(folder)) {
        return fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(folder, true, null, null);
    }

    return true;
}

