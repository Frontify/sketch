import React from 'react';
import { Text } from '@frontify/fondue';
import { EmptyPattern } from './EmptyPattern';

export function EmptyState({ title = 'No title', description = 'No description' }) {
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
                <Text>{title}</Text>
                <Text color="weak">{description}</Text>
            </custom-v-stack>
        </custom-v-stack>
    );
}
