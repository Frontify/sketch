import React from 'react';

// Components
import { Badge } from '@frontify/fondue';

// Router
import { useNavigate, Outlet } from 'react-router-dom';

// Context
import { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../context/UserContext';

// i18n
import { useTranslation } from 'react-i18next';

export function BrandView() {
    const context = useContext(UserContext);

    let { t } = useTranslation();

    const navigate = useNavigate();

    // Library scopes
    const libraryScopes = [
        {
            key: 'colors',
            title: t('brand.colors'),
        },
        {
            key: 'typography',
            title: t('brand.typography'),
        },

        {
            key: 'icons',
            title: t('brand.icons'),
        },
        {
            key: 'media',
            title: t('brand.media'),
        },
        {
            key: 'logos',
            title: t('brand.logos'),
        },
    ];

    // Make sure to refresh brand guidelines when loading this view
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
                                emphasis={context.activeLibrary == scope.key ? 'Strong' : ''}
                                style={context.activeLibrary == scope.key ? 'Progress' : 'Primary'}
                                onClick={() => {
                                    context.setActiveLibrary(scope.key);
                                    setTimeout(() => {
                                        navigate('/source/brand/' + scope.key);
                                    });
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
