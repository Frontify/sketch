import React from 'react';
import '@frontify/arcade/style';

// Router
import { useNavigate, Outlet } from 'react-router-dom';

// Arcade Components

import { Text } from '@frontify/arcade';

// Context
import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../UserContext';

// i18n
import { useTranslation } from 'react-i18next';
import { useLocalStorage } from '../hooks/useLocalStorage';

// Library scopes
const libraryScopes = [
    {
        key: 'colors',
        title: 'Colors',
    },
    {
        key: 'typography',
        title: 'Typography',
    },
    {
        key: 'symbols',
        title: 'Symbols',
    },
    {
        key: 'icons',
        title: 'Icons',
    },
    {
        key: 'media',
        title: 'Images',
    },
    {
        key: 'logos',
        title: 'Logos',
    },
];

export function MainView() {
    // Context
    const context = useContext(UserContext);

    // i18n
    const { t, i18n } = useTranslation();

    // State
    let [data, setData] = useState({});
    let [activeScope, setActiveScope] = useLocalStorage('cache.activeScope', 'colors');

    const navigate = useNavigate();

    /**
     * Scope buttons for each library type
     */
    let [scopes] = useState(libraryScopes);

    return (
        <custom-v-stack overflow="hidden">
            <custom-line></custom-line>
            <custom-scope-bar-wrapper padding="small">
                <custom-h-stack>
                    {scopes.map((scope) => (
                        <custom-scope-button className="tw-round" active={activeScope == scope.key} key={scope.key}>
                            <label>
                                <input
                                    type="radio"
                                    name="activeView"
                                    value="recent"
                                    checked={activeScope == scope.key}
                                    onChange={(event) => {
                                        navigate('/source/brand/' + scope.key);
                                        setActiveScope(scope.key);
                                    }}
                                />
                                <Text>{scope.title}</Text>
                            </label>
                        </custom-scope-button>
                    ))}
                </custom-h-stack>
            </custom-scope-bar-wrapper>
            <custom-line></custom-line>

            {/* Router Outlet that displays colors, text styles or any of the media libraries. */}

            <Outlet />
        </custom-v-stack>
    );
}
