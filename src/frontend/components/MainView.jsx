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

export function MainView() {
    const context = useContext(UserContext);

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
            <Button
                onClick={() => {
                    window.postMessage('logout');
                }}
            >
                Sign out
            </Button>
            <custom-console style={{ display: 'none' }}>
                <pre>{new Date().toLocaleTimeString()}</pre>
                <pre>---</pre>
                <pre>{JSON.stringify(data)}</pre>
                <pre>{JSON.stringify(context.user)}</pre>
                <pre>{JSON.stringify(context.brands)}</pre>

                <pre>{window.location.pathname}</pre>
            </custom-console>
            <Toolbar></Toolbar>
            <NavigationBar></NavigationBar>
            <custom-line></custom-line>
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

                    <button className="tw-underline">Current document</button>
                </Stack>
            </custom-scope-bar-wrapper>
            <custom-line></custom-line>
            <h2>Brands</h2>
            <ul>
                {context.brands.entries.length &&
                    context.brands.entries.map((brand) => {
                        return (
                            <li
                                onClick={() => {
                                    context.brands.select(brand.id);
                                }}
                            >
                                {brand.name}
                            </li>
                        );
                    })}
            </ul>
            {/* <pre>
                {context.brands.selected &&
                    JSON.stringify(
                        context.brands.selected.projects.map((project) => {
                            return { name: project.name, __typename: project.__typename };
                        }),
                        null,
                        2
                    )}
            </pre> */}
            <h2>Guidelines</h2>
            {context.guidelines.entries &&
                context.guidelines.entries.map((guideline) => (
                    <div>
                        {guideline.name} ({guideline.id})
                    </div>
                ))}

            <custom-line></custom-line>
            <custom-scope-bar-wrapper>
                <Stack padding="small">
                    {scopes.map((scope) => (
                        <custom-scope-button className="tw-round" active={activeScope == scope.key}>
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
        </div>
    );
}
