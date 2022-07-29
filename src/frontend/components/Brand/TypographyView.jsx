import React, { useState, useEffect, useContext } from 'react';

// Hooks
import { useSketch } from '../../hooks/useSketch';
import { useTranslation } from 'react-i18next';

// Context
import { UserContext } from '../../context/UserContext';

// Components
import { Button, IconCaretDown, IconCaretRight, Flyout, Text, IconMore, MenuItem } from '@frontify/fondue';

import { GuidelineSwitcher } from './GuidelineSwitcher';
import { EmptyState } from '../Core/EmptyState';
import { SearchField } from '../Core/SearchField';
import { Swatch } from './Swatch';
import { TextStyleColorsFlyout } from './TextStyleColorsFlyout';

export function TypographyView({ guidelines, palettes }) {
    const { actions, colorMap, selection } = useContext(UserContext);

    const { t } = useTranslation();

    useEffect(async () => {
        if (selection.brand) {
            await actions.fetchGuidelines(selection.brand.id);
        }
    }, []);

    const [query, setQuery] = useState('');
    const [filteredPalettes, setFilteredPalettes] = useState(palettes);

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
                <custom-combo-field>
                    <SearchField
                        value={query}
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
                {!filteredPalettes.length ? <EmptyState title={t('emptyStates.no_textstyles')}></EmptyState> : ''}
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
                                            {palette.title && (
                                                <custom-h-stack gap="x-small" overflow="hidden">
                                                    <Text color="weak">
                                                        <span style={{ opacity: 0.5 }}>/</span>
                                                    </Text>
                                                    <Text size="small" overflow="ellipsis" whitespace="nowrap">
                                                        {palette.title}
                                                    </Text>
                                                </custom-h-stack>
                                            )}
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
                                                            <TextStyleColorsFlyout
                                                                colorMap={colorMap}
                                                                textStyle={textStyle}
                                                                onChange={(value) => {
                                                                    applyTextStyle(textStyle, value);
                                                                }}
                                                            ></TextStyleColorsFlyout>
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
