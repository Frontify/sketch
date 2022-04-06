import React from 'react';
import '@frontify/arcade/style';

// Router
import { useNavigate, Outlet } from 'react-router-dom';

// Arcade Components

import { Text } from '@frontify/arcade';

// Context
import { useState } from 'react';

// i18n

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
    let [activeScope, setActiveScope] = useLocalStorage('cache.activeScope', 'colors');

    const navigate = useNavigate();

    /**
     * Scope buttons for each library type
     */
    let [scopes] = useState(libraryScopes);

    return (
        <custom-v-stack overflow="hidden" flex>
            <custom-scope-bar-wrapper padding="small">
                <custom-h-stack gap="x-small">
                    {scopes.map((scope) => (
                        <custom-scope-button className="tw-round" active={activeScope == scope.key} key={scope.key}>
                            <label>
                                <input
                                    type="radio"
                                    name="activeView"
                                    value="recent"
                                    checked={activeScope == scope.key}
                                    onChange={() => {
                                        navigate('/source/brand/' + scope.key);
                                        setActiveScope(scope.key);
                                    }}
                                />
                                <Text size="x-small">{scope.title}</Text>
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
