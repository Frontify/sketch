import React from 'react';

import '@frontify/arcade/style';

import { Button } from '@frontify/arcade/components/Button';
import { Dropdown } from '@frontify/arcade/components/Dropdown';

import { Stack } from '@frontify/arcade/foundation/layout/Stack';
import { RecentSourcesView } from './RecentSourcesView';
import { Toolbar } from './Toolbar';
import { Text } from '@frontify/arcade/foundation/typography/Text';

export default class extends React.Component {
    constructor(props) {
        super(props);

        this.handleSendDataEvent = this.handleSendDataEvent.bind(this);
        this.handleActiveViewChange = this.handleActiveViewChange.bind(this);

        this.state = {
            data: 'No data',
            activeView: 'open',
        };
    }

    handleActiveViewChange(event) {
        this.setActiveView(event.target.value);
    }

    setActiveView(view) {
        this.setState({ activeView: view });
    }

    componentDidMount() {
        window.addEventListener('send-data', this.handleSendDataEvent);
    }

    componentWillUnmount() {
        window.removeEventListener('send-data', this.handleSendDataEvent);
    }

    handleSendDataEvent(e) {
        this.setState({
            data: e.detail.data,
        });
    }
    reloadWebView() {
        location.reload();
    }
    render() {
        return (
            <div>
                <pre>{this.state.data}</pre>
                <Toolbar></Toolbar>
                <custom-scope-bar-wrapper>
                    <Stack padding="small">
                        <custom-scope-button className="tw-round" active={this.state.activeView == 'open'}>
                            <label>
                                <input
                                    type="radio"
                                    name="activeView"
                                    value="open"
                                    checked={this.state.activeView == 'open'}
                                    onChange={this.handleActiveViewChange}
                                />
                                <Text>Open</Text>
                            </label>
                        </custom-scope-button>

                        <custom-scope-button className="tw-round" active={this.state.activeView == 'recent'}>
                            <label>
                                <input
                                    type="radio"
                                    name="activeView"
                                    value="recent"
                                    checked={this.state.activeView == 'recent'}
                                    onChange={this.handleActiveViewChange}
                                />
                                <Text>Recent</Text>
                            </label>
                        </custom-scope-button>

                        <custom-spacer></custom-spacer>

                        <button className="tw-underline">Current document</button>
                    </Stack>
                </custom-scope-bar-wrapper>
                <custom-line></custom-line>
                <RecentSourcesView></RecentSourcesView>
                <Button onClick={this.reloadWebView}>Reload</Button>
                <p>{new Date().toLocaleTimeString()}</p>
                <h2>Source Picker</h2>
                <ul>
                    <li>Toolbar with User, Brand, Notifications, Refresh</li>
                    <li>Source Picker with Open, Recent, Current Document</li>
                </ul>
                <h2>Source View</h2>
                <ul>
                    <li>Toolbar with User, Brand, Notifications, Refresh</li>
                    <li>Source Navigation Bar with Upload and Contextmenu</li>
                    <li>Tabbed View with Brand and Artboards</li>
                </ul>
                <h2>Brand View</h2>
                <ul>
                    <li>Button Group with Colors, Symbols, Typography, Icons, Images, Logos</li>
                    <li>Scoped Search with Settings</li>
                    <li>Collection View for Assets</li>
                </ul>
                <h2>Artboards View</h2>
                <ul>
                    <li>List of Artboard</li>
                    <li>Upload Destination Picker</li>
                </ul>
                <h2>Upload Destination Picker</h2>
                <li>Breadcrumbs / Path</li>
                <li>New Folder (?)</li>
                <li>Files & Directories</li>
                <li>Cancel and Upload Button</li>
                <li>Progress Bar</li>
                <Button size="Small">Hello</Button>
                <Button size="Medium">Hello</Button>
                <Button size="Large">Hello</Button>
                <Dropdown menuBlocks={[]} onChange={() => {}} placeholder="select item" size="Small" />
            </div>
        );
    }
}
