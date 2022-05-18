import React, { useState, useEffect, useContext } from 'react';

// Hooks
import { useSketch } from '../../hooks/useSketch';

// Context
import { UserContext } from '../../context/UserContext';

// Components
import { Button, IconCaretDown, Flyout, Text, IconMore } from '@frontify/arcade';

import { GuidelineSwitcher } from './GuidelineSwitcher';
import { SearchField } from '../Core/SearchField';
import { Swatch } from './Swatch';

export function TypographyView({ guidelines, palettes }) {
    const { actions, colorMap, selection } = useContext(UserContext);
    const [query, setQuery] = useState('');
    const [filteredPalettes, setFilteredPalettes] = useState(palettes);
    const [openFlyout, setOpenFlyout] = useState(null);

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

    const applyTextStyle = async (textStyle, color) => {
        let response = await useSketch('applyFontStyleWithColor', { textStyle, color });
    };
    return (
        <custom-v-stack overflow="hidden">
            <custom-h-stack stretch-children padding="small" separator="bottom">
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
            </custom-h-stack>
            <custom-scroll-view>
                {filteredPalettes &&
                    filteredPalettes.map((palette) => {
                        return (
                            <custom-v-stack key={palette.id}>
                                <custom-h-stack gap="x-small" padding="small" separator="bottom">
                                    <IconCaretDown size="Size16"></IconCaretDown>

                                    <Text as="span" size="x-small">
                                        {palette.project_name} / <strong>{palette.title}</strong>
                                    </Text>
                                </custom-h-stack>

                                <custom-v-stack>
                                    {palette.styles.map((textStyle) => {
                                        return (
                                            <custom-palette-item
                                                key={textStyle.id}
                                                onClick={() => {
                                                    applyTextStyle(textStyle, null);
                                                }}
                                            >
                                                <custom-h-stack>
                                                    <custom-v-stack>
                                                        <span>{textStyle.name}</span>
                                                        <Text size="x-small">
                                                            {textStyle.family || 'Default'} / {textStyle.size} /{' '}
                                                            {textStyle.line_height}
                                                        </Text>
                                                    </custom-v-stack>
                                                    <custom-spacer></custom-spacer>

                                                    {textStyle.colors?.foreground && colorMap ? (
                                                        <Flyout
                                                            hug={true}
                                                            fitContent={true}
                                                            isOpen={openFlyout == textStyle.id}
                                                            onOpenChange={(open) => {
                                                                if (open) {
                                                                    setOpenFlyout(textStyle.id);
                                                                } else {
                                                                    setOpenFlyout(null);
                                                                }
                                                            }}
                                                            legacyFooter={false}
                                                            trigger={
                                                                <Button
                                                                    icon={<IconMore />}
                                                                    style="Secondary"
                                                                    onClick={() => {
                                                                        if (open) {
                                                                            setOpenFlyout(textStyle.id);
                                                                        } else {
                                                                            setOpenFlyout(null);
                                                                        }
                                                                    }}
                                                                ></Button>
                                                            }
                                                        >
                                                            <custom-v-stack>
                                                                {Object.keys(textStyle.colors?.foreground).map(
                                                                    (color) => (
                                                                        <custom-h-stack
                                                                            padding="small"
                                                                            gap="small"
                                                                            align-items="center"
                                                                            onClick={() => {
                                                                                applyTextStyle(textStyle, color);
                                                                            }}
                                                                        >
                                                                            <Swatch
                                                                                color={colorMap[color]?.css_value}
                                                                            ></Swatch>
                                                                            <Text>{colorMap[color]?.name}</Text>
                                                                        </custom-h-stack>
                                                                    )
                                                                )}
                                                            </custom-v-stack>
                                                        </Flyout>
                                                    ) : (
                                                        ''
                                                    )}
                                                </custom-h-stack>
                                            </custom-palette-item>
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
