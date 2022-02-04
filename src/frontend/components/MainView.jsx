import React from 'react';
import '@frontify/arcade/style';

// Router
import { Routes, Route, Link, useLocation } from 'react-router-dom';

// Arcade Components
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
            <button
                onClick={() => {
                    window.postMessage('logout');
                }}
            >
                Sign out
            </button>
            <custom-console>
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

            <h2>Brands</h2>
            <ul>
                {context.brands.length &&
                    context.brands.map((brand) => {
                        return <li>{brand.name}</li>;
                    })}
            </ul>

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

            <h2>Source Picker</h2>
            <ul>
                <li>Toolbar with User, Brand, Notifications, Refresh</li>
                <li>Source Picker with Open, Recent, Current Document</li>
            </ul>
            <custom-line></custom-line>
            <h2>Source View</h2>
            <ul>
                <li>Toolbar with User, Brand, Notifications, Refresh</li>
                <li>Source Navigation Bar with Upload and Contextmenu</li>
                <li>Tabbed View with Brand and Artboards</li>
            </ul>
            <custom-line></custom-line>
            <h2>Brand View</h2>
            <ul>
                <li>Button Group with Colors, Symbols, Typography, Icons, Images, Logos</li>
                <li>Scoped Search with Settings</li>
                <li>Collection View for Assets</li>
            </ul>
            <custom-line></custom-line>
            <h2>Artboards View</h2>
            <ul>
                <li>List of Artboard</li>
                <li>Upload Destination Picker</li>
            </ul>
            <custom-line></custom-line>
            <h2>Upload Destination Picker</h2>
            <li>Breadcrumbs / Path</li>
            <li>New Folder (?)</li>
            <li>Files & Directories</li>
            <li>Cancel and Upload Button</li>
            <li>Progress Bar</li>
        </div>
    );
}
