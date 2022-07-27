import React, { useContext, useEffect } from 'react';

// Import Styles
import '@frontify/fondue/style';

// Router
import { HashRouter } from 'react-router-dom';

// Routes
import { PluginRoutes } from './PluginRoutes';

// Context
import { UserContext } from '../context/UserContext';

// View
import { ErrorView } from './App/ErrorView';

export function Window() {
    // Refresh user and brand data on load
    let context = useContext(UserContext);
    useEffect(() => {
        // Todo: It would be ideal to refresh data whenever the plugin loads,
        // but in development, this component is hot reloaded too often which causes
        // API rate limits to take effect …
        context.actions.getUser(context.auth);
    }, []);
    return (
        <div id="window">
            {context.errors && context.errors.length ? (
                <ErrorView
                    title={context.errors[0].title}
                    description={context.errors[0].description}
                    errors={context.errors}
                ></ErrorView>
            ) : (
                ''
            )}
            <HashRouter>
                <PluginRoutes></PluginRoutes>
            </HashRouter>
        </div>
    );
}
