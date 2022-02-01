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

    /**
     * Let’s invite React to the party!
     */
    config.module.rules.push({
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
            loader: 'babel-loader',
            options: {
                presets: ['@babel/preset-env', '@babel/preset-react'],
            },
        },
    });
};
