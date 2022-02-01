import React from 'react';
import { IconSearch, TextInput } from '@frontify/arcade';

export class RecentSourcesView extends React.Component {
    constructor(props) {
        super(props);
        this.handleSearchInput = this.handleSearchInput.bind(this);
        this.state = {
            query: '',
        };
    }
    handleSearchInput(value) {
        this.setState({ query: value });
    }
    render() {
        return (
            <custom-h-stack padding="small" stretch-children>
                <TextInput
                    decorator={<IconSearch size="Size16" />}
                    type="search"
                    value={this.state.query}
                    onChange={this.handleSearchInput}
                    onInput={this.handleSearchInput}
                />
            </custom-h-stack>
        );
    }
}
