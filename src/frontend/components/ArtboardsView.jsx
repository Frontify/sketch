import React from 'react';
import { Text } from '@frontify/arcade';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
export function ArtboardsView() {
    return (
        <custom-v-stack gap="small" padding="small">
            <Text>No artboards uploaded</Text>
            <Text>Select some artboards in Sketch and click the button to add them to Frontify.</Text>
            <Link to="/source/brand">Back</Link>
        </custom-v-stack>
    );
}
