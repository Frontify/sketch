import React from 'react';
import '@frontify/arcade/style';

// Router
import { Routes, Route, Link, useLocation } from 'react-router-dom';

// Arcade Components
import { Button } from '@frontify/arcade';
import { Stack } from '@frontify/arcade/foundation/layout/Stack';
import { Text } from '@frontify/arcade/foundation/typography/Text';

// Custom Components and Views
import { RecentSourcesView } from './RecentSourcesView';
import { NavigationBar } from './NavigationBar';
import { Toolbar } from './Toolbar';

// Context
import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../UserContext';
import { PalettesView } from './PalettesView';

// i18n
import { useTranslation } from 'react-i18next';

export function MainView() {
    window.postMessage('nativeLog', 'Called from the webview');

    const context = useContext(UserContext);
    const { t, i18n } = useTranslation();

    let [data, setData] = useState({});
    let [activeView, setActiveView] = useState('open');
    let [activeScope, setActiveScope] = useState('colors');

    /**
     * Scope buttons for each library type
     */
    let [scopes] = useState([
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
    ]);

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
        context.user.getUser();
    }, []);
    useEffect(() => {
        console.log('use effect');
        window.addEventListener('send-data', handleMessage);

        return () => {
            window.removeEventListener('send-data', handleMessage);
        };
    }, []);
    return (
        <div>
            <Toolbar></Toolbar>
            <NavigationBar></NavigationBar>
            <custom-line></custom-line>

            <custom-tabs>
                <custom-tab active>
                    <Text>Brand</Text>
                </custom-tab>
                <custom-tab>
                    <Text>Artboards</Text>
                </custom-tab>
            </custom-tabs>

            <custom-line></custom-line>

            <custom-gap></custom-gap>

            <custom-scope-bar-wrapper>
                <Stack padding="small">
                    <custom-scope-button className="tw-round" active={activeView == 'open'}>
                        <label>
                            <input
                                type="radio"
                                name="activeView"
                                value="open"
                                checked={activeView == 'open'}
                                onChange={(event) => {
                                    setActiveView(event.target.value);
                                }}
                            />
                            <Text>Open</Text>
                        </label>
                    </custom-scope-button>

                    <custom-scope-button className="tw-round" active={activeView == 'recent'}>
                        <label>
                            <input
                                type="radio"
                                name="activeView"
                                value="recent"
                                checked={activeView == 'recent'}
                                onChange={(event) => {
                                    setActiveView(event.target.value);
                                }}
                            />
                            <Text>Recent</Text>
                        </label>
                    </custom-scope-button>

                    <custom-spacer></custom-spacer>

                    <button className="tw-underline">{t('sources.current_document')}</button>
                </Stack>
            </custom-scope-bar-wrapper>

            <custom-line></custom-line>
            <custom-scope-bar-wrapper>
                <Stack padding="small">
                    {scopes.map((scope) => (
                        <custom-scope-button className="tw-round" active={activeScope == scope.key} key={scope.key}>
                            <label>
                                <input
                                    type="radio"
                                    name="activeView"
                                    value="recent"
                                    checked={activeScope == scope.key}
                                    onChange={(event) => {
                                        setActiveScope(scope.key);
                                    }}
                                />
                                <Text>{scope.title}</Text>
                            </label>
                        </custom-scope-button>
                    ))}
                </Stack>
            </custom-scope-bar-wrapper>

            <custom-line></custom-line>

            <PalettesView palettes={context.palettes.entries} guidelines={context.guidelines.entries}></PalettesView>
        </div>
    );
}
