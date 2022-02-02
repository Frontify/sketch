const webpack = require('webpack');

module.exports = () => {
    return {
        plugins: [
            new webpack.EnvironmentPlugin({
                NODE_ENV: 'development',
            }),
        ],
    };
};
