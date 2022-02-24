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
    const { actions, selection } = useContext(UserContext);
    const [query, setQuery] = useState('');
    const [filteredPalettes, setFilteredPalettes] = useState(palettes);

    const sendColor = async (color) => {
        window.postMessage('applyColor', color);
    };

    useEffect(() => {
        if (!palettes) return;
        if (palettes.length == 0) return [];

        // We can sort the palettes by combining the guideline name with the name of the palette
        const getDisplayName = (palette) => {
            return `${palette.project_name} / ${palette.name}`;
        };

        setFilteredPalettes((state) => {
            return [
                ...palettes
                    .map((palette) => {
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
                    .sort((a, b) => (getDisplayName(a) > getDisplayName(b) ? 1 : -1))
                    .filter((palette) => selection.guidelines[selection.brand?.id]?.includes(palette.project)),
            ];
        });
    }, [selection, palettes, query]);

    return !filteredPalettes ? (
        <LoadingIndicator></LoadingIndicator>
    ) : (
        <custom-v-stack overflow="hidden">
            <custom-h-stack stretch-children padding="small" separator="bottom">
                <SearchField
                    onInput={(value) => {
                        setQuery(value);
                    }}
                ></SearchField>
                <div style={{ flex: 0 }}>
                    {guidelines.length ? (
                        <Switcher
                            guidelines={guidelines}
                            selection={selection.guidelines[selection.brand?.id] || []}
                            onChange={(changedGuidelines) => {
                                actions.setGuidelinesForBrand(changedGuidelines, selection.brand);
                            }}
                        ></Switcher>
                    ) : (
                        ''
                    )}
                </div>
            </custom-h-stack>
            <custom-scroll-view>
                {!filteredPalettes.length ? <custom-v-stack padding="small">No palettes</custom-v-stack> : ''}
                {filteredPalettes.map((palette) => {
                    if (query == '' || palette.colors.length) {
                        return (
                            <custom-v-stack key={palette.id}>
                                <custom-h-stack gap="x-small" padding="small" separator="bottom">
                                    <IconCaretDown size="Size16"></IconCaretDown>

                                    <Text as="span" size="x-small">
                                        {palette.project_name} / <strong>{palette.name}</strong>
                                    </Text>
                                </custom-h-stack>
                                {palette.colors.length ? (
                                    <custom-v-stack>
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
                                    <div padding="small">
                                        <Text color="weak">No colors</Text>
                                    </div>
                                )}
                            </custom-v-stack>
                        );
                    }
                })}
            </custom-scroll-view>
        </custom-v-stack>
    );
}
