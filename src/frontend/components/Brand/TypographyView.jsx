import React, { useState, useEffect, useContext } from 'react';

// Hooks
import { useSketch } from '../../hooks/useSketch';
import { useTranslation } from 'react-i18next';
import { useLocalStorage } from '../../hooks/useLocalStorage';

// Context
import { UserContext } from '../../context/UserContext';

// Components
import {
    Button,
    IconArrowSwap,
    IconCaretDown,
    IconCaretRight,
    Flyout,
    Text,
    IconMore,
    MenuItem,
    IconTypography,
    IconDownloadAlternative,
    IconExternalLink,
} from '@frontify/fondue';

import { GuidelineSwitcher } from './GuidelineSwitcher';
import { EmptyState } from '../Core/EmptyState';
import { SearchField } from '../Core/SearchField';
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
                        if (query == '' || palette.styles.length) {
                            return <Palette key={palette.id} colorMap={colorMap} palette={palette}></Palette>;
                        }
                    })}
            </custom-scroll-view>
        </custom-v-stack>
    );
}

function Palette({ colorMap, palette }) {
    const { t } = useTranslation();

    const context = useContext(UserContext);
    const [open, setOpen] = useLocalStorage('cache.palette-' + palette.id, true);
    const [contextMenuOpen, setContextMenuOpen] = useState(false);
    const [fontsMenuOpen, setFontsMenuOpen] = useState(false);

    const applyTextStyle = async (textStyle, color) => {
        await useSketch('applyFontStyleWithColor', { textStyle, prefix: palette.title });
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
                    <custom-h-stack gap="x-small" overflow="hidden" align-items="center">
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

                        <div show-on-hover="true" cursor="pointer">
                            <IconExternalLink
                                title={t('artboards.view_on_frontify')}
                                onClick={() => {
                                    useSketch('openUrl', { url: context.auth.domain + palette.project_link });
                                }}
                            />
                        </div>
                    </custom-h-stack>
                </custom-breadcrumbs>

                {palette.fonts && palette.fonts.length ? (
                    <div show-on-hover="false">
                        <Flyout
                            hug={false}
                            fitContent={true}
                            isOpen={fontsMenuOpen}
                            onOpenChange={(isOpen) => setFontsMenuOpen(isOpen)}
                            legacyFooter={false}
                            trigger={
                                <Button
                                    style="Secondary"
                                    solid={false}
                                    inverted={false}
                                    icon={<IconTypography />}
                                    onClick={() => setFontsMenuOpen((open) => !open)}
                                ></Button>
                            }
                        >
                            <custom-v-stack gap="xx-small">
                                <div>
                                    <div tabIndex={0} role="menuitem" aria-label={t('guidelines.document_text_styles')}>
                                        <MenuItem
                                            active={true}
                                            selectionIndicator="None"
                                            title={t('guidelines.fonts')}
                                        ></MenuItem>
                                    </div>
                                    <custom-line></custom-line>
                                    {palette.fonts
                                        .filter((font) => font.install_name)

                                        .map((font) => {
                                            return (
                                                <div
                                                    key={font.id}
                                                    tabIndex={0}
                                                    role="menuitem"
                                                    aria-label={t('guidelines.add_text_styles')}
                                                    onClick={() => {
                                                        setContextMenuOpen(false);
                                                        useSketch('importFontStyles', {
                                                            styles: palette.styles,
                                                            prefix: palette.title,
                                                        });
                                                    }}
                                                >
                                                    <MenuItem
                                                        decorator={<IconTypography></IconTypography>}
                                                        title={`${font.name} ${font.font_weight}`}
                                                    ></MenuItem>
                                                </div>
                                            );
                                        })}
                                    <custom-line></custom-line>

                                    <div padding="small">
                                        <Button
                                            hugWidth={true}
                                            style="Secondary"
                                            icon={<IconDownloadAlternative></IconDownloadAlternative>}
                                            onClick={() => {
                                                useSketch('downloadFonts', {
                                                    projectID: palette.project_id,
                                                });
                                                setFontsMenuOpen(false);
                                            }}
                                        >
                                            Download Fonts
                                        </Button>
                                    </div>
                                </div>
                            </custom-v-stack>
                        </Flyout>
                    </div>
                ) : (
                    ''
                )}

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
                            <div>
                                <div tabIndex={0} role="menuitem" aria-label={t('guidelines.document_text_styles')}>
                                    <MenuItem
                                        active={true}
                                        selectionIndicator="None"
                                        title={t('guidelines.document_text_styles')}
                                    ></MenuItem>
                                </div>
                                <div
                                    tabIndex={0}
                                    role="menuitem"
                                    aria-label={t('guidelines.add_text_styles')}
                                    onClick={() => {
                                        setContextMenuOpen(false);
                                        useSketch('importFontStyles', {
                                            styles: palette.styles,
                                            prefix: palette.title,
                                        });
                                    }}
                                >
                                    <MenuItem
                                        decorator={<IconArrowSwap></IconArrowSwap>}
                                        title={t('guidelines.add_text_styles')}
                                    ></MenuItem>
                                </div>
                            </div>
                        </custom-v-stack>
                    </Flyout>
                </div>
            </custom-h-stack>

            <custom-v-stack>
                {palette.styles
                    .sort((a, b) => (a.name > b.name ? 1 : -1))
                    .map((textStyle) => {
                        return (
                            open && (
                                <custom-palette-item
                                    key={textStyle.id}
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
                                            <div style={{ marginRight: '-24px' }}>
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
                            )
                        );
                    })}
            </custom-v-stack>
        </custom-v-stack>
    );
}
