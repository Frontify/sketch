# Frontify for Sketch

A [Sketch](http://sketch.com) plugin that provides integration with Frontify. Get it @ [Frontify Sketch Plugin](https://frontify.com/integrations/sketch/)

This README.md is primarily for developers. The latest plugin version,
documentation etc. are hosted at [https://frontify.com/integrations/sketch/](https://frontify.com/integrations/sketch/).

Contributions are welcome!

# What’s where?

Points of Interest:

**React:**

-   `frontend/index.jsx`
-   `frontend/components/Window.jsx`
-   `frontend/context/UserContext.jsx`

**Sketch:**

-   `src/main.js`
-   `commands/frontify.js`

# Frontend

The frontend is built using React, @frontify/arcade components and the Frontify API. The code is written in JavaScript, not TypeScript (sorry!).

**Entry:** `index.jsx → Window.jsx` 

## Window.jsx:

-   **Routing:** Navigation between tabs and views is implemented with React Router.
-   **Context:** Global state about auth, user, brand and more is stored inside the context and made available to all routes.
-   **Authentication:** A guard that decides whether to show the requested route (given a API token) or fall back to the sign in view.

## UserContext.jsx

-   Global State: Auth, User, Brand, Documents, Selections, Cache, …
-   Background uploads, upload progress handling, …
-   Methods that any component can access

## useSketch.js

This hook can be used to communicate with Sketch.
Available message types can be found in "main.js" -> webview.on('request', ...)

**Usage:**

Ideally used with async/await and destructuring:

```
// Request without parameters:
let { documents } = await useSketch("getOpenDocuments")

// Request with parameters:
let { projects } = await useSketch('getProjectsForBrand', { brand: selection.brand });
```

# CSS

Most of the interface is based on `@frontify/arcade` components.

In cases where there were no fitting components, “pseudo custom elements” have been created. These are custom HTML tags that are prefixed with `custom-` and are meant to be replaced with Arcade components when available.

The styling for these custom tags can be found in `css/custom.css`

There’s another file `utilities.css` with custom attributes that are mainly used for layout and spacing. With newer versions of @frontify/arcade, these could all be replaced with the `Stack` component which now supports more props.

---

# Sketch Backend

## Actions:

**open, close, save:**

-   Notify React about the new active document
-   Notify React about the new artboards
-   Push the active document to the list of "Recent Documents"

**artboard changed**

-   Notify React about the new artboards
-   Updates are throttled (1000 ms) so that excessive selections don’t cause too much blocking of the application

## Session Variables

-   **Recent Document:** com.frontify.sketch.recent.document
-   **Recent Action:** com.frontify.sketch.recent.action.uuid
-   **Recent Brand:** com.frontify.sketch.recent.brand.id
-   **State**: "state"

# Frontify API

The plugins uses a mix of `v1` and `GraphQL` endpoints. This is not ideal, but at the time of writing the plugin, was necessary because not every feature was supported by the GraphQL API.

## v1

Exclusively used with Sketch.

-   OAuth (including legacy polling)
-   Guidelines (Typography, Colors)
-   Uploads (Sketch files, Artboards, …)
-   Downloads (Sketch files)

## GraphQL

Primarily used with React.

-   Media Libraries, List, Search
-   Files, Folders, Subfolders
-   User, Brands
-   WorkspaceProjects

There’s one exception, where the Sketch backend uses GraphQL: `source.js → getGraphQLIDForLegacyAssetID`

This is necessary to find the GraphQL ID for assets that have just been uploaded. Because the upload uses
`v1` the uploads will return a legacy ID format. But for matching individual source files with lists of files from GraphQL, we need a shared ID.

Better solutions would be:

-   A) Uploads via GraphQL
-   B) GraphQL also returns legacy ids for assets

# Getting Started

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

_This plugin was created using `skpm`. For a detailed explanation on how things work, checkout the [skpm Readme](https://github.com/skpm/skpm/blob/master/README.md)._

To run the plugin, you need to start (2) processes: One will build the Sketch plugin with Webpack whenever plugin code changes. The other will start the dev server serving the React Frontend. Why two? Originally the plugin used Webpack to build everything but Vite is a lot faster in development. In production, Vite makes the process simpler: the build folder is simply moved to the plugin bundle.

## Install the dependencies

```bash
npm install
```

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

## Misc

This defaults prevents you from to many Sketch restarts

```bash
defaults write com.bohemiancoding.sketch3 AlwaysReloadScript -bool YES
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
