import React from 'react';
import { useState, useContext, useEffect } from 'react';

import { Link, Outlet } from 'react-router-dom';
import { SearchField } from './SearchField';
import { Toolbar } from './Toolbar';
import { Button, Flyout, IconSketch, Stack, Text } from '@frontify/arcade';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useTranslation } from 'react-i18next';

import { UserContext } from '../UserContext';

export function RecentDocumentsView() {
    let [activeView, setActiveView] = useLocalStorage('cache.activeView', 'brand');
    let [activeScope] = useLocalStorage('cache.activeScope', 'colors');
    let [activeSourceScope, setActiveSourceScope] = useLocalStorage('cache.activeSourceScope', 'open');
    let context = useContext(UserContext);

    let [sources] = useState([
        {
            id: 'S1',
            title: 'workspace_template-chooser.sketch',
            path: 'Arcade / Inventory / Graphics / Illustrations',
            artboards: [],
        },
        {
            id: 'S2',
            title: 'some other file',
            path: 'Arcade / Inventory / Graphics / Illustrations',
            artboards: [],
        },
    ]);
    const { t } = useTranslation();

    return (
        <custom-v-stack stretch>
            <custom-scroll-view stretch style={{ overflowX: 'hidden', width: '100%' }}>
                {/* Recent Documents */}
                {sources.map((source) => {
                    return (
                        <custom-h-stack
                            gap="small"
                            align-items="center"
                            separator="bottom"
                            padding="small"
                            key={source.id}
                        >
                            <IconSketch size="Size24"></IconSketch>

                            <Link to={`/source/artboards/${activeScope}`}>
                                <custom-v-stack key={source.id}>
                                    <Text size="x-small" color="weak">
                                        {source.path}
                                    </Text>
                                    <Text>{source.title}</Text>
                                </custom-v-stack>
                            </Link>
                        </custom-h-stack>
                    );
                })}
            </custom-scroll-view>

            <custom-v-stack>
                <custom-line></custom-line>

                <custom-h-stack padding="small" gap="small" align-items="center" justify-content="center">
                    <Flyout
                        trigger={
                            <Button
                                style="Secondary"
                                onClick={() => {
                                    console.log('click');
                                }}
                            >
                                {t('sources.browse_all')}
                            </Button>
                        }
                        isOpen={false}
                        onOpenChange={(isOpen) => {}}
                        legacyFooter={false}
                    >
                        <custom-v-stack padding="small" gap="small">
                            <Text>{t('sources.browse_all')}</Text>
                        </custom-v-stack>
                    </Flyout>
                    <Button style="Primary">{t('sources.sync_all')}</Button>
                </custom-h-stack>
            </custom-v-stack>
        </custom-v-stack>
    );
}
