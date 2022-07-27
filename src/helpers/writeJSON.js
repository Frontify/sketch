export default function (key, data, path) {
    let jsContent = JSON.stringify(data, null, 2);
    let jsContentNSSString = NSString.stringWithFormat('%@', jsContent);
    let jsFolderPath = path || '' + NSHomeDirectory() + '/Frontify/.config/';
    let jsContentFilePath = jsFolderPath + key + '.json';

    if (!NSFileManager.defaultManager().fileExistsAtPath(jsFolderPath)) {
        if (
            NSFileManager.defaultManager().createDirectoryAtPath_withIntermediateDirectories_attributes_error(
                jsFolderPath,
                true,
                null,
                null
            )
        ) {
            jsContentNSSString
                .dataUsingEncoding_(NSUTF8StringEncoding)
                .writeToFile_atomically_(jsContentFilePath, true);
        }
    } else {
        jsContentNSSString.dataUsingEncoding_(NSUTF8StringEncoding).writeToFile_atomically_(jsContentFilePath, true);
    }
}
