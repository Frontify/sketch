import React from 'react';
import { Text } from '@frontify/arcade';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
export function ArtboardsView() {
    return (
        <custom-scroll-view>
            <custom-v-stack gap="small" padding="small" justify-content="center" align-items="center">
                <Text size="large" weight="strong">
                    No artboards uploaded
                </Text>
                <Text>Select some artboards in Sketch and click the button to add them to Frontify.</Text>
            </custom-v-stack>
        </custom-scroll-view>
    );
}
