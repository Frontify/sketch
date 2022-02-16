import React from 'react';
import { useState, useEffect } from 'react';

import { IconCaretDown, Text } from '@frontify/arcade';

export function TypographyView({ palettes }) {
    return (
        <custom-v-stack padding="small" gap="small">
            {palettes &&
                palettes.map((palette) => {
                    return (
                        <div key={palette.id}>
                            <custom-h-stack gap="x-small">
                                <IconCaretDown size="Size16"></IconCaretDown>

                                <Text as="span" size="x-small">
                                    {palette.project_name} / <strong>{palette.title}</strong>
                                </Text>
                            </custom-h-stack>

                            <custom-v-stack gap="small">
                                {palette.styles.map((textStyle) => {
                                    return (
                                        <custom-v-stack key={textStyle.id}>
                                            <span>{textStyle.name}</span>
                                            <Text size="x-small">
                                                {textStyle.family || 'Default'} / {textStyle.size} /{' '}
                                                {textStyle.line_height}
                                            </Text>
                                        </custom-v-stack>
                                    );
                                })}
                            </custom-v-stack>
                        </div>
                    );
                })}
        </custom-v-stack>
    );
}
