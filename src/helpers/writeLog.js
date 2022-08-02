import readJSON from './readJSON';
import writeJSON from './writeJSON';

const filename = 'log';

export default function writeLog(text) {
    // Log file is an array
    let log = readJSON(filename) || [];

    // Timestamp: Text
    let newLine = `${new Date().toLocaleString()}: ${text}`;

    // New lines will be added to the top of the array
    log.unshift(newLine);

    // Console
    console.log(newLine);

    // Write to log file
    writeJSON(filename, log);
}
