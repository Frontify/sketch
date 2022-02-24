import React from 'react';
import { useState, useContext, useEffect } from 'react';

import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { SearchField } from './SearchField';
import { Toolbar } from './Toolbar';
import { Button, Flyout, IconSketch, Stack, Text } from '@frontify/arcade';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useTranslation } from 'react-i18next';

import { UserContext } from '../UserContext';
import { LoadingIndicator } from './LoadingIndicator';

export function SourcesView() {
    let [activeSourceScope, setActiveSourceScope] = useLocalStorage('cache.activeSourceScope', 'open');
    let context = useContext(UserContext);
    let location = useLocation();
    const navigate = useNavigate();

    const { t } = useTranslation();

    if (context.user?.name) {
        return (
            <custom-v-stack stretch>
                <Toolbar></Toolbar>

                <custom-scope-bar-wrapper padding="small">
                    <custom-h-stack align-items="center">
                        <custom-scope-button className="tw-round" active={location.pathname.includes('/sources/open')}>
                            <label>
                                <input
                                    type="radio"
                                    name="activeView"
                                    value="open"
                                    checked={activeSourceScope == 'open'}
                                    onChange={(event) => {
                                        navigate('/sources/open');
                                        setActiveSourceScope(event.target.value);
                                    }}
                                />

                                <Text size="x-small">{t('sources.open')}</Text>
                            </label>
                        </custom-scope-button>

                        <custom-scope-button
                            className="tw-round"
                            active={location.pathname.includes('/sources/recent')}
                        >
                            <label>
                                <input
                                    type="radio"
                                    name="activeView"
                                    value="recent"
                                    checked={activeSourceScope == 'recent'}
                                    onChange={(event) => {
                                        navigate('/sources/recent');
                                        setActiveSourceScope(event.target.value);
                                    }}
                                />

                                <Text>{t('sources.recent')}</Text>
                            </label>
                        </custom-scope-button>

                        <custom-spacer></custom-spacer>

                        <Link to={`/source/artboards`}>
                            <Text>{t('sources.current_document')}</Text>
                        </Link>
                    </custom-h-stack>
                </custom-scope-bar-wrapper>

                <custom-line></custom-line>
                <Outlet />
            </custom-v-stack>
        );
    } else {
        return <LoadingIndicator />;
    }
}
