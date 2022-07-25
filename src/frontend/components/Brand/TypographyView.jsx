import React, { useState, useEffect, useContext } from 'react';

// Hooks
import { useSketch } from '../../hooks/useSketch';

// Context
import { UserContext } from '../../context/UserContext';

// Components
import { Button, IconCaretDown, IconCaretRight, Flyout, Text, IconMore, MenuItem } from '@frontify/fondue';

import { GuidelineSwitcher } from './GuidelineSwitcher';
import { SearchField } from '../Core/SearchField';
import { Swatch } from './Swatch';

export function TypographyView({ guidelines, palettes }) {
    const { actions, colorMap, selection } = useContext(UserContext);

    useEffect(async () => {
        await actions.fetchGuidelines(selection.brand.id);
    }, []);

    const [query, setQuery] = useState('');
    const [filteredPalettes, setFilteredPalettes] = useState(palettes);
    const [openFlyout, setOpenFlyout] = useState(null);

    const [open, setOpen] = useState(true);

    const onClose = () => {};
    const onOpen = () => {};

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
        await useSketch('applyFontStyleWithColor', { textStyle });
        if (color) {
            await useSketch('applyColor', {
                r: color.r,
                g: color.g,
                b: color.b,
                a: color.alpha,
            });
        }
    };
    return (
        <custom-v-stack overflow="hidden" stretch="true">
            <custom-h-stack stretch-children padding-x="large" padding-bottom="medium">
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
            <custom-line></custom-line>

            <custom-scroll-view separator="between">
                {!filteredPalettes.length ? (
                    <custom-v-stack padding="small" stretch="true" align-items="center" justify-content="center">
                        <Text color="weak">No Text Styles</Text>
                    </custom-v-stack>
                ) : (
                    ''
                )}
                {filteredPalettes &&
                    filteredPalettes.map((palette) => {
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
                                                {palette.title}
                                            </Text>
                                        </custom-h-stack>
                                    </custom-breadcrumbs>
                                </custom-h-stack>

                                <custom-v-stack>
                                    {palette.styles.map((textStyle) => {
                                        return (
                                            <custom-palette-item
                                                key={textStyle.id}
                                                title={JSON.stringify(textStyle)}
                                                onClick={() => {
                                                    applyTextStyle(textStyle, null);
                                                }}
                                                padding-x="large"
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
                                                        <div style={{ marginRight: '-8px' }}>
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
                                                                        style="Secondary"
                                                                        solid={false}
                                                                        inverted={false}
                                                                        icon={<IconMore />}
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
                                                                    {Object.keys(textStyle.colors?.foreground)
                                                                        .filter((key) => key != null)
                                                                        .map((key) => (
                                                                            <div
                                                                                key={key}
                                                                                tabIndex={0}
                                                                                role="menuitem"
                                                                                onClick={(event) => {
                                                                                    event.stopPropagation();
                                                                                    applyTextStyle(
                                                                                        textStyle,
                                                                                        colorMap[key]
                                                                                    );
                                                                                    setOpenFlyout(false);
                                                                                }}
                                                                            >
                                                                                <MenuItem
                                                                                    title={colorMap[key]?.name}
                                                                                    decorator={
                                                                                        <Swatch
                                                                                            color={
                                                                                                colorMap[key]?.css_value
                                                                                            }
                                                                                        ></Swatch>
                                                                                    }
                                                                                >
                                                                                    {colorMap[key]?.name}{' '}
                                                                                </MenuItem>
                                                                            </div>
                                                                        ))}
                                                                </custom-v-stack>
                                                            </Flyout>
                                                        </div>
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
