import React, { useEffect, useReducer } from 'react';
import { useContext, useState } from 'react';
import { UserContext } from '../../context/UserContext';

import { MenuItem, Text, IconMore, IconLogout, IconArrowOutLogout, IconView, IconEraser } from '@frontify/fondue';
import { Button, Flyout, IconCaretDown, IconCheck, IconRefresh } from '@frontify/fondue';

// Hooks
import { useTranslation } from 'react-i18next';
import { useSketch } from '../../hooks/useSketch';

export function Toolbar() {
    const { t } = useTranslation();

    const context = useContext(UserContext);
    const [open, setOpen] = useState(false);
    const [contextMenuOpen, setContextMenuOpen] = useState(false);
    function logout() {
        context.actions.logout();
    }
    return (
        <div>
            <custom-toolbar-wrapper>
                <custom-h-stack gap="xx-small" padding-x="small" align-items="center" style={{ paddingRight: 0 }}>
                    <custom-h-stack direction="row" align-items="center">
                        <custom-h-stack align-items="center" gap={context.brands.length > 1 ? 'xx-small' : 'x-small'}>
                            <Text weight="strong" whitespace="nowrap">
                                {context.user.name}
                            </Text>

                            {context.brands.length > 1 ? (
                                <Flyout
                                    hug={false}
                                    fitContent={true}
                                    isOpen={open}
                                    onOpenChange={(isOpen) => setOpen(isOpen)}
                                    legacyFooter={false}
                                    trigger={
                                        <Button onClick={() => setOpen((open) => !open)} size="small" inverted="true">
                                            <custom-h-stack gap="xx-small" padding-x="x-small" align-items="center">
                                                {context.brands && context.selection?.brand?.name && (
                                                    <Text as="span">{context.selection?.brand?.name}</Text>
                                                )}
                                                <IconCaretDown></IconCaretDown>
                                            </custom-h-stack>
                                        </Button>
                                    }
                                >
                                    <custom-v-stack>
                                        <custom-v-stack>
                                            <custom-h-stack padding="x-small">
                                                <Text weight="strong">Brands</Text>
                                            </custom-h-stack>
                                            {context.brands.length == 0 && <Text>No brands</Text>}
                                            {context.brands &&
                                                context.brands.length &&
                                                context.brands.map((brand) => {
                                                    return (
                                                        <custom-palette-item
                                                            key={brand.id}
                                                            gap="small"
                                                            onClick={() => {
                                                                context.actions.selectBrand(brand);
                                                                setOpen(false);
                                                            }}
                                                        >
                                                            <custom-h-stack gap="x-small">
                                                                {context.selection.brand?.id == brand.id && (
                                                                    <IconCheck></IconCheck>
                                                                )}
                                                                {context.selection.brand?.id != brand.id && (
                                                                    <div style={{ width: '16px' }}></div>
                                                                )}
                                                                <Text size="small">{brand.name}</Text>
                                                            </custom-h-stack>
                                                        </custom-palette-item>
                                                    );
                                                })}
                                        </custom-v-stack>
                                    </custom-v-stack>
                                </Flyout>
                            ) : (
                                <Text>{context.selection?.brand?.name}</Text>
                            )}
                        </custom-h-stack>
                    </custom-h-stack>
                    <custom-spacer></custom-spacer>

                    <Flyout
                        hug={true}
                        fitContent={true}
                        isOpen={contextMenuOpen}
                        onOpenChange={(isOpen) => setContextMenuOpen(isOpen)}
                        legacyFooter={false}
                        trigger={
                            <Button
                                hugWidth={true}
                                inverted={true}
                                padding-x="small"
                                onClick={() => setContextMenuOpen((open) => !open)}
                                icon={<IconMore></IconMore>}
                            ></Button>
                        }
                    >
                        <custom-v-stack gap="xx-small" padding-y="xx-small">
                            <div>
                                <div
                                    tabIndex={0}
                                    role="menuitem"
                                    aria-label={t('general.reveal')}
                                    onClick={() => {
                                        // We only have access to the full path including the filename.
                                        // But macOS Finder can only reveal folders. So we need to strip
                                        // the filename and only send the folder to the handler on the
                                        // Sketch side of things.
                                        useSketch('revealFrontifyFolder', { brand: context.selection.brand });
                                        // Close the Flyout
                                        setOpen(false);
                                    }}
                                >
                                    <MenuItem decorator={<IconView />} title={t('general.reveal')}></MenuItem>
                                </div>
                                <div
                                    tabIndex={0}
                                    role="menuitem"
                                    aria-label={`Reload Plugin`}
                                    onClick={() => {
                                        window.postMessage('reload');
                                        setOpen(false);
                                    }}
                                >
                                    <MenuItem decorator={<IconRefresh />} title={'Reload Plugin'}></MenuItem>
                                </div>
                            </div>

                            {/* <custom-line></custom-line>
                            <div
                                tabIndex={0}
                                role="menuitem"
                                aria-label={`Clear Menu`}
                                onClick={() => {
                                    useSketch('clearMenu');
                                    window.postMessage('reload');
                                    setOpen(false);
                                }}
                            >
                                <MenuItem decorator={<IconEraser />} title={'Clear Menu'}></MenuItem>
                            </div> */}
                            <custom-line></custom-line>
                            <div
                                tabIndex={0}
                                role="menuitem"
                                aria-label={`Logout`}
                                onClick={() => {
                                    logout();
                                }}
                            >
                                <MenuItem decorator={<IconArrowOutLogout />} title={'Logout'}></MenuItem>
                            </div>
                            <custom-line></custom-line>

                            <div tabIndex={0} role="menuitem">
                                <MenuItem title={'Build: 9 Sep 2022 - 1'}></MenuItem>
                            </div>
                        </custom-v-stack>
                    </Flyout>
                </custom-h-stack>
            </custom-toolbar-wrapper>
        </div>
    );
}
