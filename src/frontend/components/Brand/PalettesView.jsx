import React, { useState, useEffect, useContext } from 'react';

// Components
import { Button, IconCaretDown, IconCaretRight, Text } from '@frontify/fondue';

import { GuidelineSwitcher } from './GuidelineSwitcher';
import { LoadingIndicator } from '../Core/LoadingIndicator';
import { SearchField } from '../Core/SearchField';
import { Swatch } from './Swatch';

// Context
import { UserContext } from '../../context/UserContext';

// Hooks
import { useSketch } from '../../hooks/useSketch';

export function PalettesView({ palettes, guidelines }) {
    const { actions, selection } = useContext(UserContext);
    const [query, setQuery] = useState('');
    const [filteredPalettes, setFilteredPalettes] = useState(palettes);

    const [open, setOpen] = useState(true);

    const onClose = () => {};
    const onOpen = () => {};

    const sendColor = async (color) => {
        useSketch('applyColor', color);
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
        <custom-v-stack overflow="hidden" stretch="true">
            <custom-h-stack stretch-children padding-x="large" padding-bottom="medium">
                <custom-combo-field>
                    <SearchField
                        onInput={(value) => {
                            setQuery(value);
                        }}
                    ></SearchField>
                    <div style={{ flex: 0 }}>
                        {guidelines.length ? (
                            <GuidelineSwitcher
                                guidelines={guidelines}
                                selection={selection.guidelines[selection.brand.id]}
                                onChange={(changedGuidelines) => {
                                    actions.setGuidelinesForBrand(changedGuidelines, selection.brand);
                                }}
                            ></GuidelineSwitcher>
                        ) : (
                            ''
                        )}
                    </div>
                </custom-combo-field>
            </custom-h-stack>
            <custom-line></custom-line>
            <custom-scroll-view separator="between">
                {!filteredPalettes.length ? (
                    <custom-v-stack padding="small" stretch="true" align-items="center" justify-content="center">
                        <Text color="weak">No Colors</Text>
                    </custom-v-stack>
                ) : (
                    ''
                )}
                {filteredPalettes.map((palette) => {
                    if (query == '' || palette.colors.length) {
                        return (
                            <custom-v-stack key={palette.id} padding-y="x-small">
                                <custom-h-stack
                                    gap="x-small"
                                    align-items="center"
                                    style={{ marginLeft: '16px' }}
                                    padding="xx-small"
                                >
                                    <div>
                                        {open ? (
                                            <Button
                                                inverted={false}
                                                style="Secondary"
                                                solid={false}
                                                size="Small"
                                                icon={<IconCaretDown></IconCaretDown>}
                                                onClick={() => onClose(palette.id)}
                                            ></Button>
                                        ) : (
                                            <Button
                                                inverted={false}
                                                style="Secondary"
                                                solid={false}
                                                size="Small"
                                                icon={<IconCaretRight></IconCaretRight>}
                                                onClick={() => onOpen(palette.id)}
                                            ></Button>
                                        )}
                                    </div>

                                    <custom-breadcrumbs overflow="hidden" flex>
                                        <custom-h-stack gap="x-small" overflow="hidden">
                                            <Text color="weak" size="small" overflow="ellipsis" whitespace="nowrap">
                                                {palette.project_name}
                                            </Text>
                                            <Text color="weak">
                                                <span style={{ opacity: 0.5 }}>/</span>
                                            </Text>
                                            <Text size="small" overflow="ellipsis" whitespace="nowrap">
                                                {palette.name}
                                            </Text>
                                        </custom-h-stack>
                                    </custom-breadcrumbs>
                                </custom-h-stack>

                                {palette.colors.length ? (
                                    <custom-v-stack>
                                        {palette.colors.map((color) => {
                                            return (
                                                <custom-palette-item key={color.id} padding-x="large">
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
