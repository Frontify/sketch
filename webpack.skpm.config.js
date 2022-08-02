const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = () => {
    return {
        plugins: [
            new webpack.EnvironmentPlugin({
                NODE_ENV: 'development',
            }),
            new CopyPlugin([
                {
                    from: './src/frameworks',
                    to: '../Sketch/frameworks',
                },
            ]),
        ],
    };
};
