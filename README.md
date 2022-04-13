# TODO: Update README for the React version of the plugin

# SSL Certificate for Development

The plugin is using a WebView to show a website. To speed up development, we’re pointing the WebView to our local dev server (Vite) that serves the frontend at http://localhost:3000. For security reasons, we can only load secure websites into a WebView. We can make our dev server secure by creating SSL certificates and provide those to the dev server config.

## Step: 1

Install mkcert tool - macOS; you can see the mkcert repo for details
`brew install mkcert`

## Step: 2

Setup mkcert on your machine (creates a CA)
`mkcert -install`

## Step: 3

Create certificates
`npm run cert`

# Development

To run the plugin, you need to start (2) processes: One will build the Sketch plugin with Webpack whenever plugin code changes. The other will start the dev server serving the React Frontend. Why two? Originally the plugin used Webpack to build everything but Vite is a lot faster in development. In production, Vite makes the process simpler: the build folder is simply moved to the plugin bundle.

## 1. Build the plugin

This command will use `skpm` and `webpack` to bundle the plugin. It takes care of creating the .sketchplugin bundle, moves the plugin commands and scripts and more. It does not care about the frontend.
`npm run watch`

## 2. Start the dev server

This command will start the Vite dev server. While in development, the plugin will use the dev server url.
`npm run dev`

# Build

This command will first build the plugin using `skpm`. Then, it builds the frontend using Vite. The output of Vite will be moved inside the previously built `frontify.sketchplugin/Resources/` – without any modifications. The WebView of the plugin will point to the `index.html` of that static build, no more SSL certificats required.

`npm run build`

---

# Frontify for Sketch

A [Sketch] plugin that provides integration with Frontify. Get it @ [Frontify Sketch Plugin]

This README.md is primarily for developers. The latest plugin version,
documentation etc. are hosted at [https://frontify.com/integrations/sketch/].

Contributions are welcome!

## Development

_This plugin was created using `skpm`. For a detailed explanation on how things work, checkout the [skpm Readme](https://github.com/skpm/skpm/blob/master/README.md)._

## Usage

Install the dependencies

```bash
npm install
```

Once the installation is done, you can run some commands inside the project folder:

```bash
npm run build
```

To watch for changes:

```bash
npm run watch
```

Additionally, if you wish to run the plugin every time it is built:

```bash
npm run start
```

This defaults prevents you from to many Sketch restarts

```bash
defaults write com.bohemiancoding.sketch3 AlwaysReloadScript -bool YES
```

## Custom Configuration

### Babel

To customize Babel, you have two options:

-   You may create a [`.babelrc`](https://babeljs.io/docs/usage/babelrc) file in your project's root directory. Any settings you define here will overwrite matching config-keys within skpm preset. For example, if you pass a "presets" object, it will replace & reset all Babel presets that skpm defaults to.

-   If you'd like to modify or add to the existing Babel config, you must use a `webpack.config.js` file. Visit the [Webpack](#webpack) section for more info.

### Webpack

To customize webpack create `webpack.config.js` file which exports function that will change webpack's config.

```js
/**
 * Function that mutates original webpack config.
 * Supports asynchronous changes when promise is returned.
 *
 * @param {object} config - original webpack config.
 * @param {boolean} isPluginCommand - wether the config is for a plugin command or a resource
 **/
module.exports = function (config, isPluginCommand) {
    /** you can change config here **/
};
```

## Debugging

To view the output of your `console.log`, you have a few different options:

-   Use the [`sketch-dev-tools`](https://github.com/skpm/sketch-dev-tools)
-   Open `Console.app` and look for the sketch logs
-   Look at the `~/Library/Logs/com.bohemiancoding.sketch3/Plugin Output.log` file

Skpm provides a convenient way to do the latter:

```bash
skpm log
```

The `-f` option causes `skpm log` to not stop when the end of logs is reached, but rather to wait for additional data to be appended to the input

## Frontend

To make working on the Frontend independent from Sketch make the `sketch` folder the document root of your webserver. Note: This works best in Google Chrome.

To start a web server using Python on macOS:

```bash
> cd /path/to/frontify-sketch
> python3 -m http.server 1337
```

The views are accessible by using: local-sketch.frontify.com/src/assets/views/…

[sketch]: https://sketchapp.com/
[frontify sketch plugin]: https://frontify.com/integrations/sketch/
