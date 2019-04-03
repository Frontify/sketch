let fileManager = NSFileManager.defaultManager();

export default function (path, encoding) {
    encoding = encoding || 'base64';
    if(!fileManager.fileExistsAtPath(path)) {
        return null;
    }

    let data = NSData.dataWithContentsOfFile_options_error(path, NSDataReadingUncached, null);

    if(encoding == 'base64') {
        return data.base64EncodedStringWithOptions(NSDataBase64Encoding64CharacterLineLength);
    }

    throw Error('Encoding ' + encoding + ' is currently not supported');
}
