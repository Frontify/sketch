import React from 'react';
import { useState, useContext, useEffect } from 'react';

import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { SearchField } from '../SearchField';
import { Toolbar } from '../Toolbar';
import { Badge, Button, Flyout, IconSketch, Stack, Text } from '@frontify/arcade';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useTranslation } from 'react-i18next';

import { UserContext } from '../../UserContext';
import { LoadingIndicator } from '../LoadingIndicator';

export function SourcesView() {
    let [activeSourceScope, setActiveSourceScope] = useLocalStorage('cache.activeSourceScope', 'open');
    let context = useContext(UserContext);
    let location = useLocation();
    const navigate = useNavigate();

    const { t } = useTranslation();

    if (context.user?.name) {
        return (
            <custom-v-stack stretch style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
                <Toolbar></Toolbar>

                <custom-v-stack
                    style={{
                        borderRadius: '16px',
                        overflow: 'hidden',
                        margin: ' 1rem',
                        height: ' 100%',
                        background: 'white',
                    }}
                >
                    <custom-scope-bar-wrapper padding="small">
                        <custom-h-stack align-items="center" gap="x-small">
                            {[
                                { label: t('sources.local'), value: 'local', url: '/sources/recent' },
                                { label: t('sources.remote'), value: 'remote', url: '/sources/remote' },
                            ].map((item) => {
                                return (
                                    <Badge
                                        key={item.value}
                                        emphasis={activeSourceScope == item.value ? 'Strong' : ''}
                                        style="Progress"
                                        onClick={() => {
                                            navigate(item.url);
                                            setActiveSourceScope(item.value);
                                        }}
                                    >
                                        <span style={{ textTransform: 'capitalize' }}>{item.label}</span>
                                    </Badge>
                                );
                            })}

                            <custom-spacer></custom-spacer>

                            <div>
                                <Button
                                    style="Secondary"
                                    onClick={() => {
                                        navigate('/source/artboards');
                                    }}
                                >
                                    {t('general.close')}
                                </Button>
                            </div>
                        </custom-h-stack>
                    </custom-scope-bar-wrapper>
                    <custom-line></custom-line>
                    <Outlet />
                </custom-v-stack>
            </custom-v-stack>
        );
    } else {
        return <LoadingIndicator />;
    }
}
