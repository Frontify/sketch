var path = require('path');
var fs = require('fs');
var ConcatPlugin = require('webpack-concat-plugin');
var CopyPlugin = require('copy-webpack-plugin');
var HeaderFooterPlugin = require('./build/webpackHeaderFooterPlugin');

var manifest = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'src/manifest.json'), 'utf8'));

var pluginName = 'frontify.sketchplugin';
var sketchDir = path.resolve(__dirname, pluginName, 'Contents', 'Sketch');
var resourcesDir = path.resolve(__dirname, pluginName, 'Contents', 'Resources');

// Transform script path the same way skpm does:
// "./commands/frontify.js" → "_commands_frontify.js"
function transformScriptPath(scriptPath) {
    return scriptPath.replace(/\.(?![jt]sx?$)|\//g, '_').replace(/[jt]sx?$/, 'js');
}

// Parse manifest to build entry points and collect handlers per script
var entries = {};
var handlersByScript = {};

manifest.commands.forEach(function(command) {
    var scriptPath = command.script;
    var outputName = transformScriptPath(scriptPath);

    // Resolve entry source
    var entryPath = path.resolve(__dirname, 'src', scriptPath);
    entries[outputName] = entryPath;

    // Collect handlers for this script
    if (!handlersByScript[outputName]) {
        handlersByScript[outputName] = [];
    }

    if (command.handler) {
        if (handlersByScript[outputName].indexOf(command.handler) === -1) {
            handlersByScript[outputName].push(command.handler);
        }
    }

    if (command.handlers && command.handlers.actions) {
        Object.keys(command.handlers.actions).forEach(function(action) {
            var handler = command.handlers.actions[action];
            if (handlersByScript[outputName].indexOf(handler) === -1) {
                handlersByScript[outputName].push(handler);
            }
        });
    }
});

// Build multi-compiler configs (one per entry for per-entry HeaderFooterPlugin)
var configs = Object.keys(entries).map(function(outputName) {
    var handlers = handlersByScript[outputName] || [];

    return {
        mode: 'production',
        target: 'web',
        entry: entries[outputName],
        output: {
            filename: outputName,
            path: sketchDir,
            libraryTarget: 'var',
            library: 'exports',
            hashFunction: 'sha256',
        },
        optimization: {
            minimize: false,
        },
        devtool: false,
        externals: [
            function(context, request, callback) {
                // Sketch built-in modules
                if (/^sketch(\/.*)?$/.test(request)) {
                    return callback(null, 'commonjs ' + request);
                }
                // Node core module polyfills provided by Sketch
                var coreModules = [
                    'buffer', 'console', 'events', 'fs', 'os', 'path', 'process',
                    'querystring', 'stream', 'string_decoder', 'timers', 'util'
                ];
                if (coreModules.indexOf(request) !== -1) {
                    return callback(null, 'commonjs ' + request);
                }
                callback();
            }
        ],
        resolve: {
            mainFields: ['sketch', 'browser', 'module', 'main'],
            aliasFields: ['sketch', 'browser'],
            extensions: ['.sketch.js', '.js'],
            alias: {
                jquery: path.resolve(__dirname, 'src/assets/js/libs/jquery.min.js'),
            }
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {}
                    }
                },
                {
                    test: /\.css$/,
                    use: [
                        { loader: 'style-loader' },
                        { loader: 'css-loader' },
                    ]
                },
                {
                    test: /\.tpl$/,
                    use: [
                        { loader: 'dot-tpl-loader?append=true' },
                    ]
                },
                {
                    test: /\.html$/,
                    use: [{
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                            outputPath: '../Resources/_webpack_resources/',
                            publicPath: function(url) {
                                return '"file://" + String(context.scriptPath).split(".sketchplugin/Contents/Sketch")[0] + ".sketchplugin/Contents/Resources/_webpack_resources/' + url + '"';
                            }
                        }
                    }]
                },
            ]
        },
        plugins: [
            new HeaderFooterPlugin(handlers),
        ]
    };
});

// Add shared plugins (concat + copy + manifest) only to the first config
if (configs.length > 0) {
    configs[0].plugins.push(
        new ConcatPlugin({
            uglify: false,
            sourceMap: false,
            name: 'statics',
            outputPath: '../Resources/',
            injectType: 'none',
            fileName: '[name].js',
            filesToConcat: [
                'jquery',
                './src/assets/js/libs/terrific-2.1.0.min.js',
                './src/assets/js/libs/velocity.min.js',
                './src/assets/js/libs/velocity.ui.min.js',
                './src/assets/js/libs/**',
                './src/assets/js/plugins/**',
                './src/assets/js/utils/**',
            ],
        }),
        new ConcatPlugin({
            uglify: false,
            sourceMap: false,
            name: 'statics',
            outputPath: '../Resources/css/',
            injectType: 'none',
            fileName: '[name].css',
            filesToConcat: [
                './src/assets/css/reset.css',
                './src/assets/css/fronticons.css',
                './src/assets/css/unicons.css',
                './src/assets/patterns/**/css/*.css',
                './src/assets/patterns/**/css/variants/*.css',
            ],
        }),
        new CopyPlugin([
            {
                from: './src/assets/fonts',
                to: resourcesDir + '/fonts',
            },
            {
                from: './src/assets/images',
                to: resourcesDir + '/images',
            },
            {
                from: './src/frameworks',
                to: sketchDir + '/frameworks',
            },
        ]),
        {
            // Copy and transform manifest.json
            apply: function(compiler) {
                compiler.hooks.afterEmit.tap('ManifestPlugin', function() {
                    var outputManifest = JSON.parse(JSON.stringify(manifest));
                    outputManifest.commands.forEach(function(command) {
                        command.script = transformScriptPath(command.script);
                    });
                    var manifestPath = path.resolve(sketchDir, 'manifest.json');
                    fs.writeFileSync(manifestPath, JSON.stringify(outputManifest, null, 2));
                });
            }
        }
    );
}

module.exports = configs;
