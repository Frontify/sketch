var fs = require('fs');
var path = require('path');
var os = require('os');

var pluginDir = path.join(os.homedir(),
  'Library/Application Support/com.bohemiancoding.sketch3/Plugins');
var target = path.resolve('frontify.sketchplugin');
var link = path.join(pluginDir, 'frontify.sketchplugin');

if (fs.existsSync(link)) fs.unlinkSync(link);
fs.mkdirSync(pluginDir, { recursive: true });
fs.symlinkSync(target, link);
console.log('Linked ' + link + ' -> ' + target);
