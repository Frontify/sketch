import React from 'react';

import { Link } from 'react-router-dom';
import { Toolbar } from './Toolbar';
import { useLocalStorage } from '../hooks/useLocalStorage';
export function SourcesView() {
    let [activeView, setActiveView] = useLocalStorage('cache.activeView', 'brand');

    return (
        <div>
            <Toolbar></Toolbar>
            <div>SourcesView</div>
            <Link to={`/source/${activeView}`}>Go to /source</Link>
        </div>
    );
}
