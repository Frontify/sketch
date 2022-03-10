export default function (key) {
    let jsContentFilePath = '' + NSHomeDirectory() + '/Frontify/.config/' + key + '.json';

    if (!NSFileManager.defaultManager().fileExistsAtPath(jsContentFilePath)) {
        return null;
    }

    return JSON.parse(NSString.stringWithContentsOfFile_encoding_error(jsContentFilePath, NSUTF8StringEncoding, null));
}
