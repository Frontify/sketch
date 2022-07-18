import React from 'react';

// Import Styles
import '@frontify/fondue/style';

// Router
import { HashRouter } from 'react-router-dom';

// Routes
import { PluginRoutes } from './PluginRoutes';

export function Window() {
    return (
        <HashRouter>
            <PluginRoutes></PluginRoutes>
        </HashRouter>
    );
}
