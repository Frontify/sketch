import React from 'react';

// Components
import { Badge } from '@frontify/fondue';

// Router
import { useNavigate, Outlet } from 'react-router-dom';

// Context
import { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../context/UserContext';
// i18n
import { useLocalStorage } from '../../hooks/useLocalStorage';

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

export function BrandView() {
    let [activeScope, setActiveScope] = useLocalStorage('cache.activeScope', 'colors');

    const context = useContext(UserContext);

    const navigate = useNavigate();

    useEffect(async () => {
        await context.actions.getUser(context.auth);
    }, []);

    /**
     * Scope buttons for each library type
     */
    let [scopes] = useState(libraryScopes);

    return (
        <custom-v-stack overflow="hidden" flex class="tw-bg-black-0">
            <custom-scope-bar-wrapper padding-x="large" padding-y="medium">
                <custom-h-stack align-items="center" gap="x-small">
                    {scopes.map((scope) => {
                        return (
                            <Badge
                                key={scope.key}
                                emphasis={activeScope == scope.key ? 'Strong' : ''}
                                style={activeScope == scope.key ? 'Progress' : 'Primary'}
                                onClick={() => {
                                    navigate('/source/brand/' + scope.key);
                                    setActiveScope(scope.key);
                                }}
                            >
                                <span style={{ textTransform: 'capitalize' }}>{scope.title}</span>
                            </Badge>
                        );
                    })}
                </custom-h-stack>
            </custom-scope-bar-wrapper>

            {/* Router Outlet that displays colors, text styles or any of the media libraries. */}

            <Outlet />
        </custom-v-stack>
    );
}
