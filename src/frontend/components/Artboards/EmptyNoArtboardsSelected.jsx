import React from 'react';
import { Text } from '@frontify/fondue';
import { EmptyPattern } from '../Core/EmptyPattern';

export function EmptyNoArtboardsSelected() {
    return (
        <custom-v-stack class="tw-bg-black-0" align-items="center" justify-content="center" stretch>
            <custom-v-stack
                style={{ maxWidth: '20em', textAlign: 'center' }}
                gap="small"
                stretch
                align-items="center"
                justify-content="center"
            >
                <EmptyPattern></EmptyPattern>
                <Text>Select some artboards.</Text>
                <Text color="weak">
                    You haven’t uploaded any artboards from this file yet. Try selecting some artboards in Sketch.
                </Text>
            </custom-v-stack>
        </custom-v-stack>
    );
}
