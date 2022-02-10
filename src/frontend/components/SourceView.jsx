import React from 'react';
import { Link, Outlet } from 'react-router-dom';

import { NavigationBar } from './NavigationBar';
import { Toolbar } from './Toolbar';

import { Text } from '@frontify/arcade';

export function SourceView() {
    return (
        <div>
            <Toolbar></Toolbar>
            <NavigationBar></NavigationBar>
            <custom-line></custom-line>
            <custom-tabs>
                <custom-tab active>
                    <Link to="/source/brand">
                        <Text>Brand</Text>
                    </Link>
                </custom-tab>
                <custom-tab>
                    <Link to="/source/artboards">
                        <Text>Artboards</Text>
                    </Link>
                </custom-tab>
            </custom-tabs>
            <custom-line></custom-line>
            <custom-gap></custom-gap>

            <Outlet />
        </div>
    );
}
