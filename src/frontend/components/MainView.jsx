import React from 'react';
import '@frontify/arcade/style';

// Router
import { useNavigate, Outlet } from 'react-router-dom';

// Arcade Components

import { Stack } from '@frontify/arcade/foundation/layout/Stack';
import { Text } from '@frontify/arcade/foundation/typography/Text';

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
        key: 'symbols',
        title: 'Symbols',
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
        key: 'images',
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

    function handleMessage(event) {
        let { type, payload } = event.detail.data;
        switch (type) {
            case 'user.authentication':
                context.user.setAuth(payload);
                context.user.getUser();
                break;
        }
        setData({
            data: payload,
        });
    }

    useEffect(() => {
        if (!context.user?.name) {
            if (context.user?.getUser) {
                context.user.getUser();
            } else {
                console.warn('Didn’t fetch user, because getUser() doesn’t exist.');
            }
        }
    }, []);
    useEffect(() => {
        console.log('use effect');
        window.addEventListener('send-data', handleMessage);

        return () => {
            window.removeEventListener('send-data', handleMessage);
        };
    }, []);
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
            <custom-scroll-view>
                <Outlet />
            </custom-scroll-view>
        </custom-v-stack>
    );
}
