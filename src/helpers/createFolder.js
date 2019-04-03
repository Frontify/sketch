let fileManager = NSFileManager.defaultManager();

export default function (path) {
    if (!fileManager.fileExistsAtPath(path)) {
        return fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(path, true, null, null);
    }

    return true;
}

