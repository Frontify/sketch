var ConcatPlugin = require('webpack-concat-plugin');
var CopyPlugin = require('copy-webpack-plugin');

module.exports = function (config) {
    config.target = 'web';

    config.resolve.alias = {
        jquery: __dirname + '/src/assets/js/libs/jquery.min.js',
    };

    config.module.rules.push({
        test: /\.(css)$/,
        use: [
            {
                loader: 'style-loader',
            },
            {
                loader: 'css-loader',
            },
        ],
    });

    config.module.rules.push({
        test: /\.tpl$/,
        use: [
            {
                loader: 'dot-tpl-loader?append=true',
            },
        ],
    });

    config.plugins.push(
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
        })
    );

    config.plugins.push(
        new CopyPlugin([
            {
                from: './src/assets/fonts',
                to: '../Resources/fonts',
            },
            {
                from: './src/assets/images',
                to: '../Resources/images',
            },
            {
                from: './src/frameworks',
                to: '../Sketch/frameworks',
            },
        ])
    );
};
