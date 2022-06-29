import React from 'react';

// Components
import { Text } from '@frontify/fondue';

export function SourceFileEntry({ file, path, name, onClick }) {
    return (
        <custom-palette-item
            padding-y="medium"
            padding-x="large"
            onClick={() => {
                onClick();
            }}
        >
            <custom-v-stack gap="xx-small" overflow="hidden">
                <Text color="weak">{path}</Text>
                <custom-h-stack gap="small">
                    <Text weight="strong">{name}</Text>
                </custom-h-stack>
            </custom-v-stack>
        </custom-palette-item>
    );
}
