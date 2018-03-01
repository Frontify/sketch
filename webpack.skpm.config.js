var webpack = require("webpack");
var ConcatPlugin = require('webpack-concat-plugin');
var CopyPlugin = require('copy-webpack-plugin');

module.exports = function (config) {
    config.target = 'web';

    config.resolve.alias = {
        jquery: __dirname + '/src/assets/js/libs/jquery.min.js'
    };

    config.module.rules.push({
        test: /\.(css)$/,
        use: [
            {
                loader: "style-loader",
            },
            {
                loader: "css-loader"
            }
        ]
    });

    config.module.rules.push({
        test: /\.tpl$/,
        use: [{
            loader: "dot-tpl-loader?append=true"
        }]
    });

    config.module.rules.push({
        /*
        Several sketch modules clear the coscript shouldKeepAround flag, which
        can cause the Mocha context to be prematurely destroyed, which crashes
        Sketch. This loader removes those statements, allowing our plugin to
        explicitly handle its own coscript lifecycle.
        */
        test: /node_modules\/sketch-.*\/.*\.js/,
        loader: 'regexp-replace-loader',
        options: {
            match: {
                pattern: '(coscript\\.setShouldKeepAround\\(false\\)|coscript\\.shouldKeepAround = false)',
                flags: 'ig'
            },
            replaceWith: '/* REMOVED coscript shouldKeepAround false */'
        }
    });

    config.plugins.push(
        new ConcatPlugin({
            uglify: false,
            sourceMap: false,
            name: 'statics',
            outputPath: '../Resources/',
            injectType: 'none',
            fileName: '[name].js',
            filesToConcat: ['jquery', './src/assets/js/libs/**', './src/assets/js/plugins/**', './src/assets/js/utils/**']
        }),
        new ConcatPlugin({
            uglify: false,
            sourceMap: false,
            name: 'statics',
            outputPath: '../Resources/css/',
            injectType: 'none',
            fileName: '[name].css',
            filesToConcat: ['./src/assets/css/reset.css', './src/assets/css/fronticons.css', './src/assets/css/unicons.css', './src/assets/patterns/**/css/*.css', './src/assets/patterns/**/css/variants/*.css']
        })
    );

    config.plugins.push(
        new CopyPlugin([{
            from: './src/assets/fonts',
            to: '../Resources/fonts'
        },{
            from: './src/assets/images',
            to: '../Resources/images'
        }])
    );
};