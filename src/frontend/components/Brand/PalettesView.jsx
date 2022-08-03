import React, { useState, useEffect, useContext } from 'react';

// Components
import {
    Button,
    Flyout,
    IconArrowSwap,
    IconCaretDown,
    IconCaretRight,
    IconMore,
    IconPlus,
    MenuItem,
    Text,
} from '@frontify/fondue';

import { GuidelineSwitcher } from './GuidelineSwitcher';
import { LoadingIndicator } from '../Core/LoadingIndicator';
import { EmptyState } from '../Core/EmptyState';

import { SearchField } from '../Core/SearchField';
import { Swatch } from './Swatch';

// Context
import { UserContext } from '../../context/UserContext';

// Hooks
import { useSketch } from '../../hooks/useSketch';
import { useTranslation } from 'react-i18next';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export function PalettesView({ palettes, guidelines }) {
    const { actions, selection } = useContext(UserContext);
    const [query, setQuery] = useState('');
    const [filteredPalettes, setFilteredPalettes] = useState(palettes);

    const { t } = useTranslation();

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
                {!filteredPalettes.length ? <EmptyState title={t('emptyStates.no_palettes')}></EmptyState> : ''}
                {filteredPalettes.map((palette) => {
                    if (query == '' || palette.colors.length) {
                        return <Palette palette={palette}></Palette>;
                    }
                })}
            </custom-scroll-view>
        </custom-v-stack>
    );
}

function Palette({ palette }) {
    const { t } = useTranslation();

    const [open, setOpen] = useLocalStorage('cache.palette-' + palette.id, true);
    const [contextMenuOpen, setContextMenuOpen] = useState(false);

    const sendColor = async (color) => {
        useSketch('applyColor', color);
    };

    return (
        <custom-v-stack key={palette.id} padding-y="x-small">
            <custom-h-stack gap="x-small" align-items="center" style={{ marginLeft: '16px' }} padding="xx-small">
                <div>
                    {open ? (
                        <Button
                            inverted={false}
                            style="Secondary"
                            solid={false}
                            size="Small"
                            icon={<IconCaretDown></IconCaretDown>}
                            onClick={() => setOpen(false)}
                        ></Button>
                    ) : (
                        <Button
                            inverted={false}
                            style="Secondary"
                            solid={false}
                            size="Small"
                            icon={<IconCaretRight></IconCaretRight>}
                            onClick={() => setOpen(true)}
                        ></Button>
                    )}
                </div>

                <custom-breadcrumbs overflow="hidden" flex>
                    <custom-h-stack gap="x-small" overflow="hidden">
                        <Text color="weak" size="small" overflow="ellipsis" whitespace="nowrap">
                            {palette.project_name}
                        </Text>
                        {palette.name && (
                            <custom-h-stack gap="x-small" overflow="hidden">
                                <Text color="weak">
                                    <span style={{ opacity: 0.5 }}>/</span>
                                </Text>
                                <Text size="small" overflow="ellipsis" whitespace="nowrap">
                                    {palette.name}
                                </Text>
                            </custom-h-stack>
                        )}
                    </custom-h-stack>
                </custom-breadcrumbs>

                <div show-on-hover="false" style={{ marginRight: '8px' }}>
                    <Flyout
                        hug={false}
                        fitContent={true}
                        isOpen={contextMenuOpen}
                        onOpenChange={(isOpen) => setContextMenuOpen(isOpen)}
                        legacyFooter={false}
                        trigger={
                            <Button
                                style="Secondary"
                                solid={false}
                                inverted={false}
                                icon={<IconMore />}
                                onClick={() => setContextMenuOpen((open) => !open)}
                            ></Button>
                        }
                    >
                        <custom-v-stack gap="xx-small">
                            {/* Document Colors */}

                            <div>
                                <div tabIndex={0} role="menuitem" aria-label={t('guidelines.document_colors')}>
                                    <MenuItem
                                        active={true}
                                        selectionIndicator="None"
                                        title={t('guidelines.document_colors')}
                                    ></MenuItem>
                                </div>
                                <div
                                    tabIndex={0}
                                    role="menuitem"
                                    aria-label={t('guidelines.add_to_document_colors')}
                                    onClick={() => {
                                        useSketch('addDocumentColors', { colors: palette.colors });
                                        setContextMenuOpen(false);
                                    }}
                                >
                                    <MenuItem
                                        decorator={<IconPlus />}
                                        title={t('guidelines.add_to_document_colors')}
                                    ></MenuItem>
                                </div>
                                <div
                                    tabIndex={0}
                                    role="menuitem"
                                    aria-label={t('guidelines.replace_document_colors')}
                                    onClick={() => {
                                        useSketch('replaceDocumentColors', { colors: palette.colors });
                                        setContextMenuOpen(false);
                                    }}
                                >
                                    <MenuItem
                                        decorator={<IconArrowSwap />}
                                        title={t('guidelines.replace_document_colors')}
                                    ></MenuItem>
                                </div>
                            </div>

                            {/* Divider */}

                            <custom-line margin-y="xx-small"></custom-line>

                            {/* Global Colors */}

                            <div>
                                <div tabIndex={0} role="menuitem" aria-label={t('guidelines.global_colors')}>
                                    <MenuItem
                                        active={true}
                                        selectionIndicator="None"
                                        title={t('guidelines.global_colors')}
                                    ></MenuItem>
                                </div>
                                <div
                                    tabIndex={0}
                                    role="menuitem"
                                    aria-label={t('guidelines.add_to_global_colors')}
                                    onClick={() => {
                                        useSketch('addGlobalColors', { colors: palette.colors });
                                        setContextMenuOpen(false);
                                    }}
                                >
                                    <MenuItem
                                        disabled={true}
                                        decorator={<IconPlus />}
                                        title={t('guidelines.add_to_global_colors')}
                                    ></MenuItem>
                                </div>
                                <div
                                    tabIndex={0}
                                    role="menuitem"
                                    aria-label={t('guidelines.replace_global_colors')}
                                    onClick={() => {
                                        useSketch('replaceGlobalColors', { colors: palette.colors });
                                        setContextMenuOpen(false);
                                    }}
                                >
                                    <MenuItem
                                        disabled={true}
                                        decorator={<IconArrowSwap />}
                                        title={t('guidelines.replace_global_colors')}
                                    ></MenuItem>
                                </div>
                            </div>
                        </custom-v-stack>
                    </Flyout>
                </div>
            </custom-h-stack>

            {palette.colors.length ? (
                open && (
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
                                        <Text color="weak">
                                            {color.css_value_hex ||
                                                color.css_value
                                                    .replace('rgba(', '')
                                                    .replace(')', '')
                                                    .split(',')
                                                    .join(', ')}
                                        </Text>
                                    </custom-h-stack>
                                </custom-palette-item>
                            );
                        })}
                    </custom-v-stack>
                )
            ) : (
                <EmptyState title={t('emptyStates.no_palettes')}></EmptyState>
            )}
        </custom-v-stack>
    );
}
