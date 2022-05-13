import React from 'react';
import { useContext, useEffect } from 'react';

import { UserContext } from '../../UserContext';

import { Link, Outlet, useLocation } from 'react-router-dom';

import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NavigationBar } from '../NavigationBar';
import { Toolbar } from '../Toolbar';

import { Text } from '@frontify/arcade';
import { LoadingIndicator } from '../LoadingIndicator';

export function SourceView() {
    const context = useContext(UserContext);

    const location = useLocation();

    let [activeView, setActiveView] = useLocalStorage('cache.activeView', 'brand');
    let [activeScope, setActiveScope] = useLocalStorage('cache.activeScope', 'colors');

    useEffect(() => {
        setActiveView(location.pathname);
    }, [location]);

    if (context.user?.name) {
        return (
            <custom-v-stack stretch>
                <Toolbar></Toolbar>
                <NavigationBar></NavigationBar>
                <custom-line></custom-line>
                <custom-gap></custom-gap>
                <custom-tabs>
                    <custom-tab active={location.pathname.includes('/source/artboards')}>
                        <Link to="/source/artboards">
                            <Text>Artboards</Text>
                        </Link>
                    </custom-tab>
                    <custom-tab active={location.pathname.includes('/source/brand')}>
                        <Link to={`/source/brand/${activeScope}`}>
                            <Text>Brand</Text>
                        </Link>
                    </custom-tab>
                </custom-tabs>
                <custom-line></custom-line>
                <Outlet />
            </custom-v-stack>
        );
    } else {
        return <LoadingIndicator />;
    }
}
