import React from 'react';
import { useState, useEffect } from 'react';
import { guideline } from './textStyles.js';
import { Text } from '@frontify/arcade';

export function TypographyView() {
    const [palettes, setPalettes] = useState(
        Object.keys(guideline.groups).map((key) => {
            return guideline.groups[key];
        })
    );

    return (
        <custom-v-stack padding="small" gap="small">
            {palettes.map((palette) => {
                return (
                    <div>
                        <Text as="span" size="large" weight="strong">
                            XY Guideline / {palette.title}
                        </Text>

                        <custom-v-stack gap="small">
                            {palette.styles.map((textStyle) => {
                                return (
                                    <custom-h-stack gap="small" align-items="center">
                                        <span>{textStyle.name}</span>
                                        <custom-spacer></custom-spacer>
                                    </custom-h-stack>
                                );
                            })}
                        </custom-v-stack>
                    </div>
                );
            })}
        </custom-v-stack>
    );
}
