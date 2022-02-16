import React from 'react';
import { useState, useEffect, useContext } from 'react';
import { Text } from '@frontify/arcade';
import { Swatch } from './Swatch';
import { UserContext } from '../UserContext';

import { SearchField } from './SearchField';
import { Switcher } from './Switcher';
import { IconCaretDown } from '@frontify/arcade';
import { LoadingIndicator } from './LoadingIndicator';

export function PalettesView({ palettes, guidelines }) {
    console.log('render palettes view', palettes);
    const context = useContext(UserContext);
    const [query, setQuery] = useState('');
    const [filteredPalettes, setFilteredPalettes] = useState(palettes);

    const sendColor = async (color) => {
        window.postMessage('applyColor', color);
    };

    useEffect(() => {
        if (!palettes) return;
        if (palettes.length == 0) return [];

        setFilteredPalettes(
            palettes.map((palette) => {
                // 1. Clone palette
                let filteredPalette = { ...palette };
                if (palette.colors) {
                    // 2. Filter colors, change the filteredPalette.colors
                    filteredPalette.colors = palette.colors.filter((color) => {
                        return color.name.toLowerCase().includes(query);
                    });
                }

                return filteredPalette;
            })
        );
    }, [palettes, query]);

    return !filteredPalettes ? (
        <LoadingIndicator></LoadingIndicator>
    ) : (
        <custom-v-stack padding="small" gap="large">
            <custom-h-stack stretch-children>
                <SearchField
                    onChange={(value) => {
                        setQuery(value);
                    }}
                ></SearchField>
                <div style={{ flex: 0 }}>
                    <Switcher
                        guidelines={guidelines}
                        onChange={(changedGuidelines) => {
                            context.actions.setGuidelines(changedGuidelines);
                        }}
                    ></Switcher>
                </div>
            </custom-h-stack>
            {!filteredPalettes.length ? 'No palettes' : ''}
            {filteredPalettes.map((palette) => {
                if (query == '' || palette.colors.length) {
                    return (
                        <custom-v-stack gap="small" key={palette.id}>
                            <custom-h-stack gap="x-small">
                                <IconCaretDown size="Size16"></IconCaretDown>

                                <Text as="span" size="x-small">
                                    {palette.project_name} / <strong>{palette.name}</strong>
                                </Text>
                            </custom-h-stack>
                            {palette.colors.length ? (
                                <custom-v-stack gap="x-small">
                                    {palette.colors.map((color) => {
                                        return (
                                            <custom-palette-item key={color.id}>
                                                <custom-h-stack
                                                    gap="small"
                                                    align-items="center"
                                                    onClick={() => {
                                                        sendColor({
                                                            r: color.r,
                                                            g: color.g,
                                                            b: color.b,
                                                            a: color.alpha,
                                                        });
                                                    }}
                                                >
                                                    <Swatch color={color.css_value}></Swatch>
                                                    <Text>{color.name}</Text>
                                                    <custom-spacer></custom-spacer>
                                                    <Text color="weak">{color.css_value_hex}</Text>
                                                </custom-h-stack>
                                            </custom-palette-item>
                                        );
                                    })}
                                </custom-v-stack>
                            ) : (
                                <Text color="weak">No colors</Text>
                            )}
                        </custom-v-stack>
                    );
                }
            })}
        </custom-v-stack>
    );
}
