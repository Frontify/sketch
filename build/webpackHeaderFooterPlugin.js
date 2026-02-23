'use strict';

const { ConcatSource } = require('webpack-sources');

const header = `var globalThis = this;
var global = this;
function __skpm_run (key, context) {
  globalThis.context = context;
  try {
`;

const footer = definedKeys => `    if (key === 'default' && typeof exports === 'function') {
      exports(context);
    } else if (typeof exports[key] !== 'function') {
      throw new Error('Missing export named "' + key + '". Your command should contain something like \`export function " + key +"() {}\`.');
    } else {
      exports[key](context);
    }
  } catch (err) {
    if (typeof process !== 'undefined' && process.listenerCount && process.listenerCount('uncaughtException')) {
      process.emit("uncaughtException", err, "uncaughtException");
    } else {
      throw err
    }
  }
}
${definedKeys.map(k => {
  if (k === 'onRun') {
    return `globalThis['${k}'] = __skpm_run.bind(this, 'default')`;
  }
  if (k === 'run') {
    return `globalThis['${k}'] = __skpm_run.bind(this, 'default')`;
  }
  return `globalThis['${k}'] = __skpm_run.bind(this, '${k}')`;
}).join(';\n')}
`;

module.exports = function WebpackHeaderFooterPlugin(definedKeys) {
  return {
    apply(compiler) {
      compiler.hooks.compilation.tap('HeaderFooter', compilation => {
        compilation.hooks.optimizeChunkAssets.tap('HeaderFooter', chunks => {
          chunks.forEach(chunk => {
            chunk.files.forEach(file => {
              compilation.assets[file] = new ConcatSource(header, '\n', compilation.assets[file], '\n', footer(definedKeys));
            });
          });
        });
      });
    }
  };
};
