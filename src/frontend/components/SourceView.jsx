import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

import { NavigationBar } from './NavigationBar';
import { Toolbar } from './Toolbar';

import { Text } from '@frontify/arcade';

export function SourceView() {
    const location = useLocation();

    let [activeView, setActiveView] = useLocalStorage('cache.activeView', 'brand');
    useEffect(() => {
        console.log('yo', location);
        setActiveView(location.pathname);
    }, [location]);

    return (
        <custom-v-stack style={{ height: ' 100%' }}>
            <Toolbar></Toolbar>
            <NavigationBar></NavigationBar>
            <custom-line></custom-line>
            <custom-tabs>
                <custom-tab active={location.pathname.includes('/source/brand')}>
                    <Link to="/source/brand">
                        <Text>Brand</Text>
                    </Link>
                </custom-tab>
                <custom-tab active={location.pathname.includes('/source/artboards')}>
                    <Link to="/source/artboards">
                        <Text>Artboards</Text>
                    </Link>
                </custom-tab>
            </custom-tabs>
            <custom-line></custom-line>
            <custom-gap></custom-gap>

            <custom-scroll-view>
                <Outlet />
            </custom-scroll-view>
        </custom-v-stack>
    );
}
