import React from 'react';

import { SourcePicker } from './SourcePicker';
export function SourcesViewToolbar() {
    return (
        <div separator="top">
            <SourcePicker></SourcePicker>
        </div>
    );
}
