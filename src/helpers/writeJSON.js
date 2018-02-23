var fileManager = NSFileManager.defaultManager();

export default function (context, key, data) {
    var jsContent = JSON.stringify(data);
    var jsContentNSSString = NSString.stringWithFormat("%@", jsContent);
    var jsFolderPath =  '' + NSHomeDirectory() + '/Frontify/.config/';
    var jsContentFilePath = jsFolderPath + key + '.json';

    if(!fileManager.fileExistsAtPath(jsFolderPath)) {
        if(fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(jsFolderPath, true, null, null)) {
            jsContentNSSString.dataUsingEncoding_(NSUTF8StringEncoding).writeToFile_atomically_(jsContentFilePath, true);
        }
    }
    else {
        jsContentNSSString.dataUsingEncoding_(NSUTF8StringEncoding).writeToFile_atomically_(jsContentFilePath, true);
    }
}
