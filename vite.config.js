import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

// feat(plugin-legacy): add protocol to support file protocol #1189 #2574
// https://github.com/vitejs/vite/pull/2574

function iife() {
    return {
        name: 'iife',
        apply: 'build',
        enforce: 'post',
        // Use "defer" to make sure the script loads after the DOM has been loaded, so that React can mount.
        transformIndexHtml(html) {
            return html.replace(' type="module" crossorigin ', ' defer ');
        },
    };
}

export default defineConfig({
    build: {
        outDir: '../../frontify.sketchplugin/Contents/Resources/',
        rollupOptions: {
            output: {
                format: 'iife', // Make whole module self-executing fn rather than real module
                manualChunks: () => 'everything.js', // Hack to force all imports into one file
            },
        },
    },
    plugins: [react(), iife()],

    // Vite https on localhost
    // SSL: https://stackoverflow.com/questions/69417788/vite-https-on-localhost
    server: {
        https: {
            key: fs.readFileSync('./.cert/key.pem'),
            cert: fs.readFileSync('./.cert/cert.pem'),
        },
    },
});
