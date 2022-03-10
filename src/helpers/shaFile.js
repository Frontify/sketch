export default function (path) {
    if (!NSFileManager.defaultManager().fileExistsAtPath(path)) {
        return null;
    }

    let error = MOPointer.alloc().init();
    let data = NSData.dataWithContentsOfFile_options_error(path, NSDataReadingUncached, error);

    if (error.value()) {
        return '';
    }

    return data.sha1AsString();
}
