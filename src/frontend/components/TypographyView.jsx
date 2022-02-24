import React from 'react';
import { useState, useEffect, useContext } from 'react';
import { useSketch } from '../hooks/useSketch';
import { UserContext } from '../UserContext';

import { IconCaretDown, Text } from '@frontify/arcade';

import { Switcher } from './Switcher';
import { SearchField } from './SearchField';

export function TypographyView({ guidelines, palettes }) {
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

        setFilteredPalettes(
            palettes
                .map((palette) => {
                    // 1. Clone palette
                    let filteredPalette = { ...palette };

                    if (palette.styles) {
                        // 2. Filter colors, change the filteredPalette.colors
                        filteredPalette.styles = palette.styles.filter((style) => {
                            return style.name.toLowerCase().includes(query);
                        });
                    }

                    return filteredPalette;
                })
                .sort((a, b) => (getDisplayName(a) > getDisplayName(b) ? 1 : -1))
                .filter((palette) => selection.guidelines[selection.brand?.id]?.includes(palette.project))
        );
    }, [selection, palettes, query]);

    const applyTextStyle = async (textStyle) => {
        let response = await useSketch('applyFontStyle', { textStyle });
    };
    return (
        <custom-v-stack>
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
                            selection={selection.guidelines}
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
                {filteredPalettes &&
                    filteredPalettes.map((palette) => {
                        return (
                            <custom-v-stack gap="small" key={palette.id} padding="small">
                                <custom-h-stack gap="x-small">
                                    <IconCaretDown size="Size16"></IconCaretDown>

                                    <Text as="span" size="x-small">
                                        {palette.project_name} / <strong>{palette.title}</strong>
                                    </Text>
                                </custom-h-stack>

                                <custom-v-stack gap="small">
                                    {palette.styles.map((textStyle) => {
                                        return (
                                            <custom-v-stack
                                                key={textStyle.id}
                                                onClick={() => {
                                                    applyTextStyle(textStyle);
                                                }}
                                            >
                                                <span>{textStyle.name}</span>
                                                <Text size="x-small">
                                                    {textStyle.family || 'Default'} / {textStyle.size} /{' '}
                                                    {textStyle.line_height}
                                                </Text>
                                            </custom-v-stack>
                                        );
                                    })}
                                </custom-v-stack>
                            </custom-v-stack>
                        );
                    })}
            </custom-scroll-view>
        </custom-v-stack>
    );
}
