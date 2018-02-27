var fileManager = NSFileManager.defaultManager();

export default function (key) {
    var jsContentFilePath = '' + NSHomeDirectory() + '/Frontify/.config/' + key + '.json';

    if(!fileManager.fileExistsAtPath(jsContentFilePath)) {
        return null;
    }

    return JSON.parse(NSString.stringWithContentsOfFile_encoding_error(jsContentFilePath, NSUTF8StringEncoding, null));
}
